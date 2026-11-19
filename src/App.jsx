import { useEffect, useRef, useState } from 'react'
import { useGame } from './hooks/useGame'
import { useFullscreen } from './hooks/useFullscreen'
import { playReveal, playStrike } from './lib/sounds'
import Brand from './components/Brand'
import AnswerCard from './components/AnswerCard'
import HostControls from './components/HostControls'
import HostEditor from './components/HostEditor'
import HelpOverlay from './components/HelpOverlay'
import StrikeOverlay from './components/StrikeOverlay'
import TeamPanel from './components/TeamPanel'
import './App.css'

export default function App() {
  const game = useGame()
  const { rounds, roundIndex, round, state, revealed, answers, soundOn } = game
  const [hostMode, setHostMode] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [strikeFlash, setStrikeFlash] = useState(0)
  const [isFullscreen, toggleFullscreen] = useFullscreen()

  // Sounds and the strike overlay follow the shared state, so they play here on the projector
  // no matter which device (this laptop or the phone host page) made the change.
  const seen = useRef({ roundId: round.id, revealed: state.revealed.length, strikeCount: state.strikeCount })
  useEffect(() => {
    const prev = seen.current
    seen.current = { roundId: round.id, revealed: state.revealed.length, strikeCount: state.strikeCount }
    if (prev.roundId !== round.id) {
      setStrikeFlash(0)
      return
    }
    if (state.revealed.length > prev.revealed && soundOn) playReveal()
    if (state.strikeCount > prev.strikeCount) {
      if (soundOn) playStrike()
      setStrikeFlash((f) => f + 1)
    }
  }, [round.id, state.revealed.length, state.strikeCount, soundOn])

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
        const answer = answers[Number(key) - 1]
        if (answer) game.reveal(answer.id)
        return
      }

      const actions = {
        ArrowLeft: () => game.goTo(roundIndex - 1),
        ArrowRight: () => game.goTo(roundIndex + 1),
        ' ': game.revealNext,
        r: game.resetRound,
        a: game.revealAll,
        h: game.hideAll,
        x: game.strike,
        t: game.switchTeam,
        f: toggleFullscreen,
        e: () => setHostMode((v) => !v),
        m: () => game.setSoundOn((v) => !v),
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

  const renderTeam = (i) => (
    <TeamPanel
      name={game.teamName(i)}
      side={i === 0 ? 'left' : 'right'}
      total={game.teamTotals[i]}
      roundPoints={game.roundPoints[i]}
      active={game.activeTeam === i}
      onSelect={() => game.setActiveTeam(i)}
    />
  )

  return (
    <div className={`app ${hostMode ? 'is-editing' : ''}`}>
      <div className="backdrop" aria-hidden="true">
        <div className="backdrop__glow backdrop__glow--violet" />
        <div className="backdrop__glow backdrop__glow--royal" />
        <div className="backdrop__glow backdrop__glow--magenta" />
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
        </header>

        <section className="question" key={`q-${round.id}`}>
          <p>{round.question}</p>
        </section>

        <div className="arena">
          {renderTeam(0)}

          <section className="board-frame">
            <div className="board" key={`b-${round.id}`}>
              {answers.map((answer, i) => (
                <AnswerCard
                  key={answer.id}
                  number={i + 1}
                  answer={answer}
                  revealed={revealed.has(answer.id)}
                  onToggle={() => game.toggle(answer.id)}
                />
              ))}
            </div>
            <div className="strikes" aria-label={`${state.strikes} strikes`}>
              {[0, 1, 2].map((i) => (
                <span key={i} className={`strikes__mark ${i < state.strikes ? 'is-on' : ''}`}>
                  ✕
                </span>
              ))}
            </div>
          </section>

          {renderTeam(1)}
        </div>

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
                  onClick={() => game.goTo(i)}
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
            onPrev={() => game.goTo(roundIndex - 1)}
            onNext={() => game.goTo(roundIndex + 1)}
            onReset={game.resetRound}
            onRevealAll={game.revealAll}
            onHideAll={game.hideAll}
            onStrike={game.strike}
            onSwitchTeam={game.switchTeam}
            soundOn={soundOn}
            onToggleSound={() => game.setSoundOn((v) => !v)}
            hostMode={hostMode}
            onToggleHost={() => setHostMode((v) => !v)}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            onToggleHelp={() => setShowHelp((v) => !v)}
          />
        </footer>
      </main>

      {strikeFlash > 0 && <StrikeOverlay key={strikeFlash} count={Math.max(state.strikes, 1)} />}

      {hostMode && <HostEditor game={game} onClose={() => setHostMode(false)} />}

      {showHelp && <HelpOverlay onClose={() => setShowHelp(false)} />}
    </div>
  )
}
