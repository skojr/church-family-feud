import defaultRounds, { isValidRounds, sortByVotes } from '../data/rounds'
import { useLocalStorage } from './useLocalStorage'

const cloneDefaults = () => structuredClone(defaultRounds)
const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

const defaultTeams = () => [
  { name: 'Team 1', bonus: 0 },
  { name: 'Team 2', bonus: 0 },
]
const isValidTeams = (v) =>
  Array.isArray(v) &&
  v.length === 2 &&
  v.every((t) => isPlainObject(t) && typeof t.name === 'string' && Number.isFinite(t.bonus))
const isTeamIndex = (v) => v === 0 || v === 1

const emptyRoundState = { revealed: [], strikes: 0, strikeCount: 0, awarded: {} }

// Points a round has earned each team: revealed answers credited to the team that was answering.
const roundTeamPoints = (round, state) => {
  const points = [0, 0]
  const revealed = new Set(state?.revealed ?? [])
  const awarded = state?.awarded ?? {}
  for (const a of round.answers) {
    const team = awarded[a.id]
    if (a.text.trim() && revealed.has(a.id) && isTeamIndex(team)) {
      points[team] += Number(a.votes) || 0
    }
  }
  return points
}

// All shared game state and actions, used by both the projector display and the host page.
// Everything is stored through useLocalStorage, which also syncs it to other windows.
export function useGame() {
  const [rounds, setRounds] = useLocalStorage('igc-feud:rounds', cloneDefaults, isValidRounds)
  const [storedIndex, setRoundIndex] = useLocalStorage('igc-feud:round', 0)
  // { [roundId]: { revealed: number[], strikes: number, strikeCount: number, awarded: { [answerId]: teamIndex } } }
  // `strikes` is what the board shows (max 3); `strikeCount` goes up on every press so the
  // display can flash the strike overlay even when the board is already at 3.
  const [roundState, setRoundState] = useLocalStorage('igc-feud:state', {}, isPlainObject)
  const [soundOn, setSoundOn] = useLocalStorage('igc-feud:sound', true)
  // `bonus` holds manual adjustments from Host Edit on top of the points earned from reveals.
  const [teams, setTeams] = useLocalStorage('igc-feud:teams', defaultTeams, isValidTeams)
  const [activeTeam, setActiveTeam] = useLocalStorage('igc-feud:active-team', 0, isTeamIndex)

  const roundIndex = Math.min(Math.max(Number(storedIndex) || 0, 0), rounds.length - 1)
  const round = rounds[roundIndex]
  const state = { ...emptyRoundState, ...roundState[round.id] }
  const revealed = new Set(state.revealed)
  const answers = sortByVotes(round.answers)
  const playable = answers.filter((a) => a.text.trim())
  const roundPoints = roundTeamPoints(round, state)
  const earnedTotals = rounds.reduce(
    (sum, r) => {
      const p = roundTeamPoints(r, roundState[r.id])
      return [sum[0] + p[0], sum[1] + p[1]]
    },
    [0, 0],
  )
  const teamTotals = teams.map((t, i) => earnedTotals[i] + t.bonus)

  const updateState = (patch) =>
    setRoundState((prev) => {
      const current = { ...emptyRoundState, ...prev[round.id] }
      return { ...prev, [round.id]: { ...current, ...patch(current) } }
    })

  const reveal = (id) => {
    const answer = round.answers.find((a) => a.id === id)
    if (!answer?.text.trim() || revealed.has(id)) return
    updateState((s) => ({
      revealed: [...s.revealed, id],
      awarded: { ...s.awarded, [id]: activeTeam },
    }))
  }

  const hide = (id) =>
    updateState((s) => {
      const awarded = { ...s.awarded }
      delete awarded[id]
      return { revealed: s.revealed.filter((r) => r !== id), awarded }
    })

  const toggle = (id) => (revealed.has(id) ? hide(id) : reveal(id))

  const revealNext = () => {
    const next = playable.find((a) => !revealed.has(a.id))
    if (next) reveal(next.id)
  }

  const revealAll = () =>
    updateState((s) => {
      const awarded = { ...s.awarded }
      for (const a of playable) if (!revealed.has(a.id)) awarded[a.id] = activeTeam
      return { revealed: playable.map((a) => a.id), awarded }
    })

  const hideAll = () => updateState(() => ({ revealed: [], awarded: {} }))
  const resetRound = () => updateState(() => ({ revealed: [], strikes: 0, awarded: {} }))

  const strike = () =>
    updateState((s) => ({
      strikes: Math.min(s.strikes + 1, 3),
      strikeCount: s.strikeCount + 1,
    }))

  const switchTeam = () => setActiveTeam((t) => (t === 0 ? 1 : 0))

  const goTo = (i) => setRoundIndex(Math.min(Math.max(i, 0), rounds.length - 1))

  const updateRound = (patch) =>
    setRounds((prev) => prev.map((r, i) => (i === roundIndex ? { ...r, ...patch(r) } : r)))

  const changeQuestion = (question) => updateRound(() => ({ question }))

  const changeAnswer = (id, patch) =>
    updateRound((r) => ({
      answers: r.answers.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }))

  const restoreRound = () => updateRound(() => structuredClone(defaultRounds[roundIndex]))

  const restoreAll = () => {
    if (!window.confirm('Restore ALL questions and vote counts to the defaults?')) return
    setRounds(cloneDefaults())
    setRoundState({})
  }

  const updateTeam = (i, patch) =>
    setTeams((prev) => prev.map((t, j) => (j === i ? { ...t, ...patch } : t)))

  const changeTeamName = (i, name) => updateTeam(i, { name })

  const setTeamTotal = (i, total) => updateTeam(i, { bonus: total - earnedTotals[i] })

  const resetScores = () => {
    if (!window.confirm('Reset both team scores to 0? Revealed answers stay revealed.')) return
    setTeams((prev) => prev.map((t) => ({ ...t, bonus: 0 })))
    setRoundState((prev) =>
      Object.fromEntries(Object.entries(prev).map(([id, s]) => [id, { ...s, awarded: {} }])),
    )
  }

  const teamName = (i) => teams[i].name.trim() || `Team ${i + 1}`

  return {
    rounds,
    roundIndex,
    round,
    state,
    revealed,
    answers,
    playable,
    roundPoints,
    teams,
    teamTotals,
    teamName,
    activeTeam,
    soundOn,
    setSoundOn,
    setActiveTeam,
    reveal,
    hide,
    toggle,
    revealNext,
    revealAll,
    hideAll,
    resetRound,
    strike,
    switchTeam,
    goTo,
    changeQuestion,
    changeAnswer,
    restoreRound,
    restoreAll,
    changeTeamName,
    setTeamTotal,
    resetScores,
  }
}
