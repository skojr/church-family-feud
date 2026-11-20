// Buzzer station firmware for ESP32 DevKit V1.
//
// One arcade button + its LED. Nothing to edit before flashing: the same
// firmware goes on both boards.
//
//  - First boot (or Wi-Fi not found): the board opens a setup hotspot,
//    "Buzzer-Setup" / "Buzzer-A-Setup". Join it from a phone, pick the
//    network, type the password, choose station A or B, save.
//  - Then it joins Wi-Fi and finds the hub on its own (mDNS "_buzzer._tcp").
//  - Hold the button while plugging the board in (3 s) to wipe the settings
//    and open the setup hotspot again.
//
// Libraries (Arduino Library Manager):
//   "WebSockets" by Markus Sattler
//   "WiFiManager" by tzapu
// Board: "DOIT ESP32 DEVKIT V1" (esp32 by Espressif).

#include <WiFi.h>
#include <WiFiManager.h>
#include <ESPmDNS.h>
#include <Preferences.h>
#include <WebSocketsClient.h>

#define FW_VERSION "1.4"

// Pins (DevKit V1 labels D27 / D26).
#define BUTTON_PIN 27  // arcade switch; the other switch pin goes to GND
#define LED_PIN 26     // to the transistor/MOSFET that switches the button lamp
#define LED_ACTIVE_LOW 0
#define ONBOARD_LED 2  // blue LED on the board; shows the same patterns

#define DEFAULT_HUB_PORT 8090
#define DEBOUNCE_MS 30
#define STATUS_EVERY_MS 5000
#define RESET_HOLD_MS 3000
#define DISCOVER_EVERY_MS 4000
#define REDISCOVER_AFTER_MS 10000  // hub gone this long -> look for it again (it may have moved)
#define PORTAL_RETRY_MS 120000     // setup hotspot idle this long with saved Wi-Fi -> reboot and retry

Preferences prefs;
WiFiManager wm;
WebSocketsClient ws;

String stationId = "A";
String hubSetting = "";  // "" = find automatically, else "ip" or "ip:port"
String hostname;

// ------------------------------------------------------------------ LED --
enum LedMode { LED_SETUP, LED_NO_WIFI, LED_NO_HUB, LED_READY, LED_WIN, LED_LOSE, LED_LOCKED, LED_IDENTIFY };
LedMode ledMode = LED_NO_WIFI;
LedMode ledBeforeIdentify = LED_READY;
unsigned long ledSince = 0;

void setLed(LedMode mode) {
  if (mode == LED_IDENTIFY && ledMode != LED_IDENTIFY) ledBeforeIdentify = ledMode;
  if (mode != ledMode) ledSince = millis();
  ledMode = mode;
}

void writeLed(uint8_t level) {  // 0..255
  ledcWrite(LED_PIN, LED_ACTIVE_LOW ? 255 - level : level);
  digitalWrite(ONBOARD_LED, level > 40 ? HIGH : LOW);
}

void updateLed() {
  unsigned long t = millis() - ledSince;
  switch (ledMode) {
    case LED_SETUP: {  // triple blink: setup hotspot is open
      unsigned long p = t % 1500;
      writeLed((p < 450 && (p / 75) % 2 == 0) ? 255 : 0);
      break;
    }
    case LED_NO_WIFI:  // slow blink: looking for Wi-Fi
      writeLed((t / 500) % 2 ? 0 : 255);
      break;
    case LED_NO_HUB: {  // double blink: on Wi-Fi, looking for the hub
      unsigned long p = t % 1200;
      writeLed((p < 100 || (p > 200 && p < 300)) ? 255 : 0);
      break;
    }
    case LED_READY: {  // breathing: armed, press me
      float phase = (t % 2000) / 2000.0f;
      float s = 0.5f - 0.5f * cosf(phase * 2 * PI);
      writeLed(40 + (uint8_t)(s * s * 215));
      break;
    }
    case LED_WIN:  // strobe for 2 s, then solid
      writeLed(t < 2000 ? ((t / 80) % 2 ? 0 : 255) : 255);
      break;
    case LED_IDENTIFY:  // 6 quick blinks, then back to whatever it was
      if (t >= 1800) setLed(ledBeforeIdentify);
      else writeLed((t / 150) % 2 ? 0 : 255);
      break;
    default:  // lose / locked
      writeLed(0);
  }
}

// ---------------------------------------------------------- setup portal --
bool portalMode = false;
bool portalSaved = false;
unsigned long portalSince = 0;
char stationBuf[2];
char hubBuf[40];
WiFiManagerParameter *pStation;
WiFiManagerParameter *pHub;

void saveSettings() {
  String s = String(pStation->getValue());
  s.trim();
  s.toUpperCase();
  stationId = (s == "B") ? "B" : "A";
  hubSetting = String(pHub->getValue());
  hubSetting.trim();
  prefs.putString("station", stationId);
  prefs.putString("hub", hubSetting);
  Serial.printf("[setup] saved: station %s, hub '%s'\n", stationId.c_str(),
                hubSetting.length() ? hubSetting.c_str() : "auto");
}

void startWifi() {
  stationId.toCharArray(stationBuf, sizeof(stationBuf));
  hubSetting.toCharArray(hubBuf, sizeof(hubBuf));
  pStation = new WiFiManagerParameter("station", "Station letter (A or B)", stationBuf, 1);
  pHub = new WiFiManagerParameter("hub", "Hub address (leave blank to find it automatically)", hubBuf, 39);
  wm.addParameter(pStation);
  wm.addParameter(pHub);

  wm.setTitle("Buzzer Station");
  wm.setClass("invert");  // dark page
  std::vector<const char *> menu = {"wifi", "info", "restart"};
  wm.setMenu(menu);
  wm.setConnectTimeout(20);
  wm.setBreakAfterConfig(true);  // save our fields even if the Wi-Fi password was wrong
  wm.setSaveConfigCallback([]() { portalSaved = true; });
  wm.setConfigPortalBlocking(false);  // keep the LED animating while the hotspot is up

  String ap = prefs.isKey("station") ? "Buzzer-" + stationId + "-Setup" : "Buzzer-Setup";
  if (wm.autoConnect(ap.c_str())) {
    Serial.printf("[wifi] connected to %s\n", WiFi.SSID().c_str());
  } else {
    portalMode = true;
    portalSince = millis();
    setLed(LED_SETUP);
    Serial.printf("[setup] hotspot \"%s\" is open — join it from a phone (page: 192.168.4.1)\n", ap.c_str());
  }
}

void runPortal() {
  wm.process();
  if (portalSaved) {
    saveSettings();
    Serial.println("[setup] restarting with new settings");
    delay(500);
    ESP.restart();
  }
  // Wi-Fi was set up before but wasn't there at boot (e.g. router rebooting):
  // if nobody is using the hotspot, reboot now and then to try it again.
  if (wm.getWiFiIsSaved() && WiFi.softAPgetStationNum() == 0 && millis() - portalSince > PORTAL_RETRY_MS) {
    Serial.println("[setup] retrying saved Wi-Fi");
    ESP.restart();
  }
}

// Hold the button while powering on to wipe Wi-Fi + station settings.
void checkFactoryReset() {
  if (digitalRead(BUTTON_PIN) != LOW) return;
  Serial.println("[reset] button held at boot — keep holding 3 s to reset settings");
  unsigned long start = millis();
  while (digitalRead(BUTTON_PIN) == LOW) {
    writeLed((millis() / 60) % 2 ? 0 : 255);
    if (millis() - start > RESET_HOLD_MS) {
      wm.resetSettings();
      prefs.clear();
      Serial.println("[reset] settings wiped, restarting into setup");
      writeLed(255);
      delay(1000);
      ESP.restart();
    }
    delay(5);
  }
  writeLed(0);
}

// ------------------------------------------------------------------- hub --
bool hubUp = false;
bool wsStarted = false;
bool mdnsStarted = false;
String hubHost;
uint16_t hubPort = DEFAULT_HUB_PORT;
unsigned long lastDiscover = 0;
unsigned long hubLostSince = 0;
unsigned long lastStatus = 0;
uint32_t pressCount = 0;

void sendHello() {
  String msg = String("{\"type\":\"hello\",\"role\":\"station\",\"station\":\"") + stationId +
               "\",\"fw\":\"" FW_VERSION "\",\"rssi\":" + WiFi.RSSI() + ",\"mac\":\"" + WiFi.macAddress() + "\"}";
  ws.sendTXT(msg);
}

void onWs(WStype_t type, uint8_t *payload, size_t length) {
  switch (type) {
    case WStype_CONNECTED:
      hubUp = true;
      Serial.printf("[hub] connected to %s:%u\n", hubHost.c_str(), hubPort);
      setLed(LED_LOCKED);  // the hub replies with the real LED state right away
      sendHello();
      break;
    case WStype_DISCONNECTED:
      if (hubUp) {
        Serial.println("[hub] disconnected");
        hubLostSince = millis();
      }
      hubUp = false;
      break;
    case WStype_TEXT: {
      const char *msg = (const char *)payload;
      // Clock sync: echo the hub's time back with ours, immediately, so the
      // hub can map our press timestamps onto its own clock.
      if (strstr(msg, "\"type\":\"sync\"")) {
        int64_t s = esp_timer_get_time();
        const char *h = strstr(msg, "\"h\":");
        if (!h) break;
        h += 4;
        char num[32];
        size_t i = 0;
        while (h[i] && h[i] != ',' && h[i] != '}' && i < sizeof(num) - 1) {
          num[i] = h[i];
          i++;
        }
        num[i] = 0;
        char out[96];
        snprintf(out, sizeof(out), "{\"type\":\"sync\",\"h\":%s,\"s\":%lld}", num, (long long)s);
        ws.sendTXT(out);
        break;
      }
      if (!strstr(msg, "\"type\":\"led\"")) break;
      if (strstr(msg, "\"mode\":\"ready\"")) setLed(LED_READY);
      else if (strstr(msg, "\"mode\":\"win\"")) setLed(LED_WIN);
      else if (strstr(msg, "\"mode\":\"lose\"")) setLed(LED_LOSE);
      else if (strstr(msg, "\"mode\":\"locked\"")) setLed(LED_LOCKED);
      else if (strstr(msg, "\"mode\":\"identify\"")) setLed(LED_IDENTIFY);
      break;
    }
    default:
      break;
  }
}

// Work out where the hub is: the address typed in setup, or ask the network.
bool locateHub(String &host, uint16_t &port) {
  if (hubSetting.length()) {
    int colon = hubSetting.indexOf(':');
    host = colon < 0 ? hubSetting : hubSetting.substring(0, colon);
    port = colon < 0 ? DEFAULT_HUB_PORT : hubSetting.substring(colon + 1).toInt();
    return true;
  }
  int n = MDNS.queryService("buzzer", "tcp");
  if (n <= 0) {
    Serial.println("[hub] searching the network… (is `npm start` running?)");
    return false;
  }
  IPAddress ip = MDNS.address(0);
  port = MDNS.port(0);
  // The service answer doesn't always carry the address; if not, look the
  // hub's host name up separately.
  if (ip == IPAddress(0, 0, 0, 0)) {
    String name = MDNS.hostname(0);
    if (name.endsWith(".local")) name.remove(name.length() - 6);
    if (name.length()) ip = MDNS.queryHost(name, 2000);
  }
  if (ip == IPAddress(0, 0, 0, 0) || port == 0) {
    Serial.println("[hub] found the hub but not its address yet, retrying…");
    return false;  // never connect to 0.0.0.0
  }
  host = ip.toString();
  if (n > 1) Serial.printf("[hub] warning: %d hubs found, using the first\n", n);
  return true;
}

void maintainHub() {
  if (hubUp) return;
  bool needLookup = !wsStarted || (!hubSetting.length() && millis() - hubLostSince > REDISCOVER_AFTER_MS);
  if (!needLookup || millis() - lastDiscover < DISCOVER_EVERY_MS) return;
  lastDiscover = millis();

  String host;
  uint16_t port;
  if (!locateHub(host, port)) return;
  if (wsStarted && host == hubHost && port == hubPort) {
    hubLostSince = millis();  // same place; let the socket keep retrying
    return;
  }
  hubHost = host;
  hubPort = port;
  Serial.printf("[hub] found at %s:%u\n", hubHost.c_str(), hubPort);
  if (wsStarted) ws.disconnect();
  ws.begin(hubHost.c_str(), hubPort, "/ws");
  ws.onEvent(onWs);
  ws.setReconnectInterval(1000);
  ws.enableHeartbeat(5000, 4000, 3);  // drop and reconnect if the hub stops answering (~25 s; slow Wi-Fi is tolerated)
  wsStarted = true;
  hubLostSince = millis();
}

// --------------------------------------------------------------- button --
// Fires on the very first LOW after the button has been released for
// DEBOUNCE_MS — no delay added to the press, and release bounce is ignored.
bool releasedLongEnough = false;
unsigned long highSince = 0;

void pollButton() {
  bool down = digitalRead(BUTTON_PIN) == LOW;
  unsigned long nowMs = millis();

  if (!down) {
    if (highSince == 0) highSince = nowMs;
    if (nowMs - highSince >= DEBOUNCE_MS) releasedLongEnough = true;
    return;
  }

  highSince = 0;
  if (!releasedLongEnough) return;
  releasedLongEnough = false;

  int64_t pressedAt = esp_timer_get_time();  // the hub judges by this, not by arrival order
  pressCount++;
  if (hubUp) {
    char out[96];
    snprintf(out, sizeof(out), "{\"type\":\"press\",\"station\":\"%s\",\"seq\":%u,\"t\":%lld}", stationId.c_str(),
             pressCount, (long long)pressedAt);
    ws.sendTXT(out);
    Serial.printf("[btn] press #%u sent\n", pressCount);
  } else {
    Serial.printf("[btn] press #%u (hub not connected, ignored)\n", pressCount);
  }
}

// ---------------------------------------------------------------- setup --
void setup() {
  Serial.begin(115200);
  delay(200);

  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(ONBOARD_LED, OUTPUT);
  ledcAttach(LED_PIN, 5000, 8);  // 5 kHz PWM, 8-bit, so "ready" can breathe
  writeLed(0);

  prefs.begin("buzzer", false);
  stationId = prefs.getString("station", "A");
  hubSetting = prefs.getString("hub", "");
  hostname = "buzzer-" + stationId;
  hostname.toLowerCase();
  Serial.printf("\nBuzzer station %s (fw %s)\n", stationId.c_str(), FW_VERSION);

  WiFi.setHostname(hostname.c_str());
  WiFi.mode(WIFI_STA);
  checkFactoryReset();

  WiFi.setSleep(false);  // Wi-Fi power save adds 100+ ms of random delay — keep it off
  WiFi.setAutoReconnect(true);
  startWifi();
}

// ----------------------------------------------------------------- loop --
bool wifiWasUp = false;

void loop() {
  if (portalMode) {
    runPortal();
    updateLed();
    return;
  }

  bool wifiUp = WiFi.status() == WL_CONNECTED;
  if (wifiUp != wifiWasUp) {
    wifiWasUp = wifiUp;
    if (wifiUp) {
      Serial.printf("[wifi] connected, IP %s, RSSI %d dBm\n", WiFi.localIP().toString().c_str(), WiFi.RSSI());
      WiFi.setSleep(false);
      if (!mdnsStarted) mdnsStarted = MDNS.begin(hostname.c_str());
    } else {
      Serial.println("[wifi] lost");
    }
  }

  if (wifiUp) {
    maintainHub();
    if (wsStarted) ws.loop();
  }

  if (!wifiUp) setLed(LED_NO_WIFI);
  else if (!hubUp) setLed(LED_NO_HUB);
  else if (ledMode == LED_NO_WIFI || ledMode == LED_NO_HUB) setLed(LED_LOCKED);

  pollButton();
  updateLed();

  if (hubUp && millis() - lastStatus > STATUS_EVERY_MS) {
    lastStatus = millis();
    ws.sendTXT(String("{\"type\":\"status\",\"rssi\":") + WiFi.RSSI() + "}");
  }
}
