import { useEffect, useState } from 'react'
import defaultRounds, { isValidRounds } from './data/rounds'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useFullscreen } from './hooks/useFullscreen'
import { playReveal, playStrike } from './lib/sounds'
import Brand from './components/Brand'
import AnswerCard from './components/AnswerCard'
import HostControls from './components/HostControls'
import HostEditor from './components/HostEditor'
import HelpOverlay from './components/HelpOverlay'
import StrikeOverlay from './components/StrikeOverlay'
import './App.css'

const cloneDefaults = () => structuredClone(defaultRounds)
const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

export default function App() {
  const [rounds, setRounds] = useLocalStorage('igc-feud:rounds', cloneDefaults, isValidRounds)
  const [storedIndex, setRoundIndex] = useLocalStorage('igc-feud:round', 0)
  // { [roundId]: { revealed: number[], strikes: number } }
  const [roundState, setRoundState] = useLocalStorage('igc-feud:state', {}, isPlainObject)
  const [soundOn, setSoundOn] = useLocalStorage('igc-feud:sound', true)
  const [hostMode, setHostMode] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [strikeTick, setStrikeTick] = useState(0)
  const [isFullscreen, toggleFullscreen] = useFullscreen()

  const roundIndex = Math.min(Math.max(Number(storedIndex) || 0, 0), rounds.length - 1)
  const round = rounds[roundIndex]
  const state = roundState[round.id] ?? { revealed: [], strikes: 0 }
  const revealed = new Set(state.revealed)
  const playable = round.answers.filter((a) => a.text.trim())
  const score = playable.filter((a) => revealed.has(a.id)).reduce((s, a) => s + a.votes, 0)

  const updateState = (patch) =>
    setRoundState((prev) => {
      const current = prev[round.id] ?? { revealed: [], strikes: 0 }
      return { ...prev, [round.id]: { ...current, ...patch(current) } }
    })

  const reveal = (id) => {
    const answer = round.answers.find((a) => a.id === id)
    if (!answer?.text.trim() || revealed.has(id)) return
    if (soundOn) playReveal()
    updateState((s) => ({ revealed: [...s.revealed, id] }))
  }

  const toggle = (id) => {
    if (revealed.has(id)) updateState((s) => ({ revealed: s.revealed.filter((r) => r !== id) }))
    else reveal(id)
  }

  const revealNext = () => {
    const next = playable.find((a) => !revealed.has(a.id))
    if (next) reveal(next.id)
  }

  const revealAll = () => {
    if (playable.some((a) => !revealed.has(a.id)) && soundOn) playReveal()
    updateState(() => ({ revealed: playable.map((a) => a.id) }))
  }

  const hideAll = () => updateState(() => ({ revealed: [] }))
  const resetRound = () => updateState(() => ({ revealed: [], strikes: 0 }))

  const strike = () => {
    if (soundOn) playStrike()
    updateState((s) => ({ strikes: Math.min((s.strikes ?? 0) + 1, 3) }))
    setStrikeTick((t) => t + 1)
  }

  const goTo = (i) => {
    setRoundIndex(Math.min(Math.max(i, 0), rounds.length - 1))
    setStrikeTick(0)
  }

  const updateRound = (patch) =>
    setRounds((prev) => prev.map((r, i) => (i === roundIndex ? { ...r, ...patch(r) } : r)))

  const restoreRound = () => {
    updateRound(() => structuredClone(defaultRounds[roundIndex]))
  }

  const restoreAll = () => {
    if (!window.confirm('Restore ALL questions and vote counts to the defaults?')) return
    setRounds(cloneDefaults())
    setRoundState({})
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) {
        if (e.key === 'Escape') e.target.blur()
        return
      }

      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      if (key >= '1' && key <= '6') {
        const answer = round.answers[Number(key) - 1]
        if (answer) reveal(answer.id)
        return
      }

      const actions = {
        ArrowLeft: () => goTo(roundIndex - 1),
        ArrowRight: () => goTo(roundIndex + 1),
        ' ': revealNext,
        r: resetRound,
        a: revealAll,
        h: hideAll,
        x: strike,
        f: toggleFullscreen,
        e: () => setHostMode((v) => !v),
        m: () => setSoundOn((v) => !v),
        '?': () => setShowHelp((v) => !v),
        Escape: () => {
          setShowHelp(false)
          setHostMode(false)
        },
      }
      const action = actions[key]
      if (action) {
        e.preventDefault()
        action()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className={`app ${hostMode ? 'is-editing' : ''}`}>
      <div className="backdrop" aria-hidden="true">
        <div className="backdrop__glow backdrop__glow--blue" />
        <div className="backdrop__glow backdrop__glow--purple" />
        <div className="backdrop__glow backdrop__glow--orange" />
        <div className="backdrop__beams" />
      </div>

      <main className="stage">
        <header className="topbar">
          <div className="scorebox">
            <span className="scorebox__label">Round</span>
            <span className="scorebox__value">
              {roundIndex + 1}
              <small> of {rounds.length}</small>
            </span>
          </div>
          <Brand />
          <div className="scorebox scorebox--points">
            <span className="scorebox__label">Points</span>
            <span className="scorebox__value" key={score}>
              {score}
            </span>
          </div>
        </header>

        <section className="question" key={`q-${round.id}`}>
          <p>{round.question}</p>
        </section>

        <section className="board-frame">
          <div className="board" key={`b-${round.id}`}>
            {round.answers.map((answer, i) => (
              <AnswerCard
                key={answer.id}
                number={i + 1}
                answer={answer}
                revealed={revealed.has(answer.id)}
                onToggle={() => toggle(answer.id)}
              />
            ))}
          </div>
          <div className="strikes" aria-label={`${state.strikes ?? 0} strikes`}>
            {[0, 1, 2].map((i) => (
              <span key={i} className={`strikes__mark ${i < (state.strikes ?? 0) ? 'is-on' : ''}`}>
                ✕
              </span>
            ))}
          </div>
        </section>

        <footer className="footer">
          <nav className="progress" aria-label="Rounds">
            <span className="progress__label">
              Round {roundIndex + 1} of {rounds.length}
            </span>
            <div className="progress__track">
              {rounds.map((r, i) => (
                <button
                  key={r.id}
                  type="button"
                  className={`progress__step ${i === roundIndex ? 'is-current' : ''} ${
                    i < roundIndex ? 'is-done' : ''
                  }`}
                  onClick={() => goTo(i)}
                  title={`Round ${i + 1}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </nav>

          <HostControls
            canPrev={roundIndex > 0}
            canNext={roundIndex < rounds.length - 1}
            onPrev={() => goTo(roundIndex - 1)}
            onNext={() => goTo(roundIndex + 1)}
            onReset={resetRound}
            onRevealAll={revealAll}
            onHideAll={hideAll}
            onStrike={strike}
            soundOn={soundOn}
            onToggleSound={() => setSoundOn((v) => !v)}
            hostMode={hostMode}
            onToggleHost={() => setHostMode((v) => !v)}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            onToggleHelp={() => setShowHelp((v) => !v)}
          />
        </footer>
      </main>

      {strikeTick > 0 && <StrikeOverlay key={strikeTick} count={state.strikes ?? 1} />}

      {hostMode && (
        <HostEditor
          round={round}
          roundIndex={roundIndex}
          totalRounds={rounds.length}
          onChangeQuestion={(question) => updateRound(() => ({ question }))}
          onChangeAnswer={(id, patch) =>
            updateRound((r) => ({
              answers: r.answers.map((a) => (a.id === id ? { ...a, ...patch } : a)),
            }))
          }
          onRestoreRound={restoreRound}
          onRestoreAll={restoreAll}
          onClose={() => setHostMode(false)}
        />
      )}

      {showHelp && <HelpOverlay onClose={() => setShowHelp(false)} />}
    </div>
  )
}
