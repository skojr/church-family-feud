import { useState, useSyncExternalStore } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  HandCoins,
  RotateCcw,
  Undo2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { useGame } from '../hooks/useGame'
import { isConnected, onConnectionChange, syncEnabled } from '../lib/sync'
import HostEditor from './HostEditor'
import '../App.css'
import './HostView.css'

function ConnectionBadge() {
  const connected = useSyncExternalStore(onConnectionChange, isConnected)
  if (!syncEnabled) return <span className="host__status is-off">Not synced (run npm run host)</span>
  return (
    <span className={`host__status ${connected ? 'is-on' : 'is-off'}`}>
      {connected ? 'Connected' : 'Reconnecting…'}
    </span>
  )
}

// Phone remote for the projector display. Open at /?view=host on the same network.
export default function HostView() {
  const game = useGame()
  const { rounds, roundIndex, round, state, revealed, answers, activeTeam, soundOn } = game
  const [tab, setTab] = useState('play')

  return (
    <div className="host">
      <header className="host__banner">
        <strong>Host view</strong>
        <span>Not for the projector</span>
        <ConnectionBadge />
      </header>

      <nav className="host__tabs">
        <button type="button" className={tab === 'play' ? 'is-on' : ''} onClick={() => setTab('play')}>
          Play
        </button>
        <button type="button" className={tab === 'edit' ? 'is-on' : ''} onClick={() => setTab('edit')}>
          Edit votes &amp; teams
        </button>
      </nav>

      <section className="host__round">
        <button
          type="button"
          className="host__nav"
          onClick={() => game.goTo(roundIndex - 1)}
          disabled={roundIndex === 0}
          aria-label="Previous round"
        >
          <ChevronLeft size={26} />
        </button>
        <div>
          <p className="host__round-label">
            Round {roundIndex + 1} of {rounds.length}
          </p>
          <p className="host__question">{round.question}</p>
        </div>
        <button
          type="button"
          className="host__nav"
          onClick={() => game.goTo(roundIndex + 1)}
          disabled={roundIndex === rounds.length - 1}
          aria-label="Next round"
        >
          <ChevronRight size={26} />
        </button>
      </section>

      {tab === 'edit' ? (
        <HostEditor game={game} inline />
      ) : (
        <>
          <section className="host__teams">
            {[0, 1].map((i) => (
              <button
                key={i}
                type="button"
                className={`host__team ${activeTeam === i ? 'is-active' : ''}`}
                onClick={() => game.setActiveTeam(i)}
                aria-pressed={activeTeam === i}
              >
                <span className="host__team-flag">{activeTeam === i ? 'Answering' : 'Tap to answer'}</span>
                <span className="host__team-name">{game.teamName(i)}</span>
                <span className="host__team-total">{game.teamTotals[i]}</span>
                <span className="host__team-round">This round: {game.roundPoints[i]}</span>
              </button>
            ))}
          </section>

          <p className="host__hint">
            Tapping an answer reveals it on screen and gives its votes to{' '}
            <strong>{game.teamName(activeTeam)}</strong>. Tap again to hide it.
          </p>

          <section className="host__answers">
            {answers.map((a, i) => {
              const empty = !a.text.trim()
              const isRevealed = revealed.has(a.id)
              const team = state.awarded[a.id]
              return (
                <button
                  key={a.id}
                  type="button"
                  className={`host__answer ${isRevealed ? 'is-revealed' : ''}`}
                  disabled={empty}
                  onClick={() => game.toggle(a.id)}
                  aria-pressed={isRevealed}
                >
                  <span className="host__answer-num">{i + 1}</span>
                  <span className="host__answer-text">
                    {empty ? '(blank)' : a.text}
                    {isRevealed && (team === 0 || team === 1) && (
                      <small>Shown · {game.teamName(team)}</small>
                    )}
                    {!isRevealed && !empty && <small>Hidden</small>}
                  </span>
                  <span className="host__answer-votes">{a.votes}</span>
                </button>
              )
            })}
          </section>

          <section className="host__actions">
            <button type="button" className="host__btn host__btn--strike" onClick={game.strike}>
              <X size={22} /> Strike ({state.strikes}/3)
            </button>
            <button type="button" className="host__btn" onClick={game.switchTeam}>
              Switch team
            </button>
            <button type="button" className="host__btn" onClick={game.steal}>
              {state.steal ? <Undo2 size={18} /> : <HandCoins size={18} />}{' '}
              {state.steal ? 'Undo steal' : `Steal for ${game.teamName(game.stealTo)}`}
            </button>
            <button type="button" className="host__btn" onClick={game.revealAll}>
              <Eye size={18} /> Reveal all
            </button>
            <button type="button" className="host__btn" onClick={game.hideAll}>
              <EyeOff size={18} /> Hide all
            </button>
            <button type="button" className="host__btn" onClick={game.resetRound}>
              <RotateCcw size={18} /> Reset round
            </button>
            <button type="button" className="host__btn" onClick={() => game.setSoundOn((v) => !v)}>
              {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />} Sound {soundOn ? 'on' : 'off'}
            </button>
          </section>
        </>
      )}
    </div>
  )
}
