// Edit questions, answers, and vote counts here.
// Every round must have exactly 6 answers. Leave `text` empty ("") to show a blank, unclickable slot.
// Votes entered through Host Edit mode are saved in the browser and override these defaults
// until "Restore defaults" is used.

const rounds = [
  {
    id: 1,
    question: 'Name something that people often pray for.',
    answers: [
      { id: 1, text: 'Good health', votes: 0 },
      { id: 2, text: 'Protect loved ones', votes: 0 },
      { id: 3, text: 'Financial blessings', votes: 0 },
      { id: 4, text: 'Relationship success', votes: 0 },
      { id: 5, text: 'Career prosperity', votes: 0 },
      { id: 6, text: 'Peace and guidance', votes: 0 },
    ],
  },
  {
    id: 2,
    question: 'Name a Bible story that many people remember from childhood.',
    answers: [
      { id: 1, text: "Noah's Ark", votes: 0 },
      { id: 2, text: 'David and Goliath', votes: 0 },
      { id: 3, text: "Daniel in the lions' den", votes: 0 },
      { id: 4, text: 'Jonah and the big fish', votes: 0 },
      { id: 5, text: 'Moses parting the Red Sea', votes: 0 },
      { id: 6, text: 'Samson’s locs and strength', votes: 0 },
    ],
  },
  {
    id: 3,
    question: 'Name something kids try to ignore when their parents say it.',
    answers: [
      { id: 1, text: 'Come and wash the dishes', votes: 0 },
      { id: 2, text: 'Clean your room', votes: 0 },
      { id: 3, text: 'Turn off the TV', votes: 0 },
      { id: 4, text: 'Come downstairs', votes: 0 },
      { id: 5, text: 'Put your phone away', votes: 0 },
      { id: 6, text: 'Go to sleep', votes: 0 },
    ],
  },
  {
    id: 4,
    question: 'Name something people rush to do immediately after service.',
    answers: [
      { id: 1, text: 'Watch TV/sports', votes: 0 },
      { id: 2, text: 'Take a nap', votes: 0 },
      { id: 3, text: 'Eat food', votes: 0 },
      { id: 4, text: 'Hang out with friends', votes: 0 },
      { id: 5, text: 'Do errands', votes: 0 },
      { id: 6, text: 'Socialize at church', votes: 0 },
    ],
  },
  {
    id: 5,
    question:
      'Name something kids think is a basic human right but African parents consider a privilege.',
    answers: [
      { id: 1, text: 'Wi-Fi', votes: 0 },
      { id: 2, text: 'Privacy', votes: 0 },
      { id: 3, text: 'Sleepovers', votes: 0 },
      { id: 4, text: 'Going out', votes: 0 },
      { id: 5, text: 'Having a phone', votes: 0 },
      { id: 6, text: 'Watching TV', votes: 0 },
    ],
  },
  {
    id: 6,
    question: 'Name a moment in the Bible that required a lot of faith.',
    answers: [
      { id: 1, text: 'Moses splitting the sea', votes: 0 },
      { id: 2, text: 'Abraham sacrificing Isaac', votes: 0 },
      { id: 3, text: 'Shadrach, Meshach, and Abednego going into the furnace', votes: 0 },
      { id: 4, text: 'Daniel going into the lion’s den', votes: 0 },
      { id: 5, text: 'The centurion asking Jesus to heal his son', votes: 0 },
      { id: 6, text: 'Peter walking on the sea to Jesus', votes: 0 },
    ],
  },
  {
    id: 7,
    question: 'Name something people might give up or change during a fast.',
    answers: [
      { id: 1, text: 'Social media', votes: 0 },
      { id: 2, text: 'Meat', votes: 0 },
      { id: 3, text: 'Sweets', votes: 0 },
      { id: 4, text: 'Television', votes: 0 },
      { id: 5, text: 'Eating altogether during certain hours', votes: 0 },
      { id: 6, text: 'Entertainment', votes: 0 },
    ],
  },
  {
    id: 8,
    question:
      'Name a reason an African parent would give for not allowing their child to leave the house.',
    answers: [
      { id: 1, text: 'Incident on the news', votes: 0 },
      { id: 2, text: 'It is too late', votes: 0 },
      { id: 3, text: 'Unacquainted with those hosting the event', votes: 0 },
      { id: 4, text: 'Chores and errands', votes: 0 },
      { id: 5, text: 'Have a commitment in the morning/need to get enough sleep', votes: 0 },
      { id: 6, text: 'I had a dream', votes: 0 },
    ],
  },
  {
    id: 9,
    question: 'Name an excuse someone might give for missing Bible study.',
    answers: [
      { id: 1, text: 'Having homework/work', votes: 0 },
      { id: 2, text: 'Feeling sick', votes: 0 },
      { id: 3, text: 'A bit tired', votes: 0 },
      { id: 4, text: 'Come another time', votes: 0 },
      { id: 5, text: 'Need to run errands', votes: 0 },
      { id: 6, text: 'Already committed to doing something else', votes: 0 },
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
