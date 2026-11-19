// Edit questions, answers, and vote counts here.
// Every round must have exactly 6 answers. Leave `text` empty ("") to show a blank, unclickable slot.
// Votes entered through Host Edit mode are saved in the browser and override these defaults
// until "Restore defaults" is used.

const rounds = [
  {
    id: 1,
    question: 'Name something people pray for.',
    answers: [
      { id: 1, text: 'Good health', votes: 32 },
      { id: 2, text: 'Family protection', votes: 25 },
      { id: 3, text: 'Financial blessings', votes: 19 },
      { id: 4, text: 'Guidance', votes: 12 },
      { id: 5, text: 'A new job', votes: 8 },
      { id: 6, text: 'Peace of mind', votes: 4 },
    ],
  },
  {
    id: 2,
    question: 'Name something you bring to church.',
    answers: [
      { id: 1, text: 'Bible', votes: 38 },
      { id: 2, text: 'Offering', votes: 22 },
      { id: 3, text: 'Phone', votes: 15 },
      { id: 4, text: 'Notebook & pen', votes: 11 },
      { id: 5, text: 'Snacks for the kids', votes: 8 },
      { id: 6, text: 'A friend', votes: 6 },
    ],
  },
  {
    id: 3,
    question: 'Name a famous person from the Bible.',
    answers: [
      { id: 1, text: 'Jesus', votes: 30 },
      { id: 2, text: 'Moses', votes: 24 },
      { id: 3, text: 'David', votes: 17 },
      { id: 4, text: 'Noah', votes: 13 },
      { id: 5, text: 'Abraham', votes: 9 },
      { id: 6, text: 'Paul', votes: 7 },
    ],
  },
  {
    id: 4,
    question: 'Name a food you would find at a church potluck.',
    answers: [
      { id: 1, text: 'Jollof rice', votes: 29 },
      { id: 2, text: 'Fried chicken', votes: 24 },
      { id: 3, text: 'Mac & cheese', votes: 18 },
      { id: 4, text: 'Desserts', votes: 14 },
      { id: 5, text: 'Salad', votes: 9 },
      { id: 6, text: 'Meat pies', votes: 6 },
    ],
  },
  {
    id: 5,
    question: 'Name a reason someone might be late to church.',
    answers: [
      { id: 1, text: 'Overslept', votes: 34 },
      { id: 2, text: 'Traffic', votes: 23 },
      { id: 3, text: 'Getting the kids ready', votes: 18 },
      { id: 4, text: 'Choosing an outfit', votes: 12 },
      { id: 5, text: 'Car trouble', votes: 8 },
      { id: 6, text: 'Bad weather', votes: 5 },
    ],
  },
  {
    id: 6,
    question: 'Name a popular worship song.',
    answers: [
      { id: 1, text: 'Way Maker', votes: 28 },
      { id: 2, text: 'Amazing Grace', votes: 24 },
      { id: 3, text: 'Goodness of God', votes: 18 },
      { id: 4, text: '10,000 Reasons', votes: 13 },
      { id: 5, text: 'How Great Is Our God', votes: 10 },
      { id: 6, text: 'Oceans', votes: 7 },
    ],
  },
  {
    id: 7,
    question: "Name an animal on Noah's Ark.",
    answers: [
      { id: 1, text: 'Lion', votes: 27 },
      { id: 2, text: 'Elephant', votes: 23 },
      { id: 3, text: 'Giraffe', votes: 18 },
      { id: 4, text: 'Dove', votes: 14 },
      { id: 5, text: 'Zebra', votes: 10 },
      { id: 6, text: 'Monkey', votes: 8 },
    ],
  },
  {
    id: 8,
    question: 'Name something a pastor often says during a sermon.',
    answers: [
      { id: 1, text: 'Can I get an Amen?', votes: 33 },
      { id: 2, text: 'Turn to your neighbor', votes: 22 },
      { id: 3, text: 'Open your Bibles', votes: 16 },
      { id: 4, text: 'Hallelujah', votes: 13 },
      { id: 5, text: 'In closing...', votes: 10 },
      { id: 6, text: 'Somebody say...', votes: 6 },
    ],
  },
  {
    id: 9,
    question: 'Name a book of the Bible.',
    answers: [
      { id: 1, text: 'Genesis', votes: 31 },
      { id: 2, text: 'Psalms', votes: 22 },
      { id: 3, text: 'John', votes: 17 },
      { id: 4, text: 'Revelation', votes: 13 },
      { id: 5, text: 'Matthew', votes: 10 },
      { id: 6, text: 'Proverbs', votes: 7 },
    ],
  },
  {
    id: 10,
    question: 'Name something people do right after church service.',
    answers: [
      { id: 1, text: 'Eat lunch', votes: 36 },
      { id: 2, text: 'Fellowship & chat', votes: 21 },
      { id: 3, text: 'Take a nap', votes: 16 },
      { id: 4, text: 'Go home', votes: 12 },
      { id: 5, text: 'Watch sports', votes: 9 },
      { id: 6, text: 'Go shopping', votes: 6 },
    ],
  },
]

export const ANSWERS_PER_ROUND = 6

export function isValidRounds(value) {
  return (
    Array.isArray(value) &&
    value.length === rounds.length &&
    value.every(
      (r) =>
        r &&
        typeof r.question === 'string' &&
        Array.isArray(r.answers) &&
        r.answers.length === ANSWERS_PER_ROUND,
    )
  )
}

// Highest votes first; blank slots always sink to the bottom. Ties keep their original order.
export function sortByVotes(answers) {
  return [...answers].sort((a, b) => {
    const aBlank = !a.text.trim()
    const bBlank = !b.text.trim()
    if (aBlank !== bBlank) return aBlank ? 1 : -1
    return (Number(b.votes) || 0) - (Number(a.votes) || 0)
  })
}

export default rounds
