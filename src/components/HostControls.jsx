import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Keyboard,
  Maximize,
  Minimize,
  Pencil,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'

function Btn({ icon: Icon, label, onClick, active, disabled, variant, hint }) {
  return (
    <button
      type="button"
      className={`ctrl ${variant ? `ctrl--${variant}` : ''} ${active ? 'is-active' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={hint ? `${label} (${hint})` : label}
    >
      <Icon size={18} strokeWidth={2.4} />
      <span>{label}</span>
    </button>
  )
}

export default function HostControls({
  canPrev,
  canNext,
  onPrev,
  onNext,
  onReset,
  onRevealAll,
  onHideAll,
  onStrike,
  onSwitchTeam,
  soundOn,
  onToggleSound,
  hostMode,
  onToggleHost,
  isFullscreen,
  onToggleFullscreen,
  onToggleHelp,
}) {
  return (
    <div className="controls">
      <div className="controls__group">
        <Btn icon={ChevronLeft} label="Prev" onClick={onPrev} disabled={!canPrev} hint="←" />
        <Btn icon={RotateCcw} label="Reset" onClick={onReset} hint="R" />
        <Btn icon={EyeOff} label="Hide All" onClick={onHideAll} hint="H" />
        <Btn icon={Eye} label="Reveal All" onClick={onRevealAll} hint="A" />
        <Btn icon={X} label="Strike" onClick={onStrike} variant="danger" hint="X" />
        <Btn icon={ArrowLeftRight} label="Team" onClick={onSwitchTeam} hint="T" />
        <Btn icon={ChevronRight} label="Next" onClick={onNext} disabled={!canNext} hint="→" />
      </div>
      <div className="controls__group">
        <Btn
          icon={soundOn ? Volume2 : VolumeX}
          label={soundOn ? 'Sound' : 'Muted'}
          onClick={onToggleSound}
          hint="M"
        />
        <Btn icon={Pencil} label="Host Edit" onClick={onToggleHost} active={hostMode} hint="E" />
        <Btn icon={Keyboard} label="Keys" onClick={onToggleHelp} hint="?" />
        <Btn
          icon={isFullscreen ? Minimize : Maximize}
          label={isFullscreen ? 'Exit' : 'Fullscreen'}
          onClick={onToggleFullscreen}
          variant="accent"
          hint="F"
        />
      </div>
    </div>
  )
}
