import { useEffect, useRef } from 'react'
import { emit, onHubConnect, onHubMessage, sendToHub } from '../lib/hub'

const STATIONS = ['A', 'B'] // buzzer Station A = Team 1, Station B = Team 2

// Links the projector display to the buzzer hub. Used once, in App (the board),
// not in the phone host page: the board sees every change whichever device
// made it, so each cue goes out exactly once.
//
// - Reports reveals, hides, strikes, round changes, the board total and the
//   teams (names, totals, answering team) to the hub, which drives the LED
//   screens and sends OSC.
// - When a buzzer wins, makes that team the answering team.
export function useHubLink(game) {
  const { round, roundIndex, state, answers, playable, revealed, teamTotals, activeTeam } = game

  const boardScore = playable.filter((a) => revealed.has(a.id)).reduce((s, a) => s + a.votes, 0)
  const teams = [0, 1].map((i) => ({ name: game.teamName(i), score: teamTotals[i] }))
  const teamsKey = JSON.stringify([teams, activeTeam])

  // Everything the hub may need when it (re)connects.
  const current = {
    round: roundIndex + 1,
    question: round.question,
    boardScore,
    strikes: state.strikes,
    teams,
    activeTeam,
  }
  const live = useRef(current)
  useEffect(() => {
    live.current = current
  })

  const sendAll = () => {
    const c = live.current
    emit('round', c.round, c.question)
    emit('score', c.boardScore)
    emit('strikes', c.strikes)
    sendToHub({ type: 'teams', teams: c.teams, answering: c.activeTeam })
  }

  // Changes since the last render -> cues.
  const seen = useRef(null)
  useEffect(() => {
    const prev = seen.current
    seen.current = {
      roundId: round.id,
      revealed: new Set(state.revealed),
      strikeCount: state.strikeCount,
      boardScore,
      teamsKey,
    }
    if (!prev) return // first render: the connect handler sends the starting state

    if (prev.roundId !== round.id) {
      emit('round', roundIndex + 1, round.question)
      emit('strikes', state.strikes)
    } else {
      const slot = (id) => answers.findIndex((a) => a.id === id) + 1
      for (const id of state.revealed) {
        if (!prev.revealed.has(id)) {
          const a = answers.find((x) => x.id === id)
          if (a) emit('reveal', slot(id), a.text, a.votes)
        }
      }
      for (const id of prev.revealed) {
        if (!state.revealed.includes(id)) emit('hide', slot(id))
      }
      if (state.strikeCount > prev.strikeCount) emit('strike', state.strikes)
    }
    if (prev.boardScore !== boardScore || prev.roundId !== round.id) emit('score', boardScore)
    if (prev.teamsKey !== teamsKey) sendToHub({ type: 'teams', teams, answering: activeTeam })
  })

  // Resend everything whenever the hub (re)connects.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => onHubConnect(sendAll), [])

  // A buzzer win picks the answering team.
  const setActiveTeam = game.setActiveTeam
  useEffect(
    () =>
      onHubMessage((msg) => {
        if (msg.type !== 'buzz') return
        const team = STATIONS.indexOf(msg.station)
        if (team !== -1) setActiveTeam(team)
      }),
    [setActiveTeam],
  )
}
