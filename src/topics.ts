// What a talk with the duck is about (duck.ts), picked in the talk window
// before it starts: the duck's first line, said at once without the model, its
// role and how the talk goes. Two of them are role plays, the duck in a role
// that it plays to the end.

export type Topic = {
  id: string
  title: string
  /** Who the duck is in this talk. */
  role: string
  /** How the talk goes: what the duck does, step by step for a role play. */
  plan: string
  /** A role play: the duck leads, asking at each turn (duck.ts lets it alternate otherwise). */
  leads?: boolean
  openers: readonly string[]
}

export const TOPICS: readonly Topic[] = [
  {
    id: 'free',
    title: 'Free talk',
    role: 'This is a free talk about anything.',
    plan: 'Follow the learner: their questions come first. Answer them fully, with what you really know, then add a thought of your own or ask about theirs.',
    openers: ['Hi! What would you like to talk about today?', 'Hey there! How is your day going so far?'],
  },
  {
    id: 'day',
    title: 'My day',
    role: "This talk is about the learner's day.",
    plan: 'Ask what they did, what is next and how they feel about it, one thing at a time. React to what they tell you, and now and then share a small, funny thing from your own day as a duck.',
    openers: ['So, how was your day? Tell me one thing that happened.', 'What have you been up to today?'],
  },
  {
    id: 'trip',
    title: 'A trip',
    role: 'This talk is about a trip the learner took or wants to take.',
    plan: 'Ask about the places, the plans, the food and the people. Share what you know about the places they name: what to see, what to eat, what it is like there.',
    openers: ['Tell me about a trip you remember. Where did you go?', 'If you could go anywhere next month, where would you go?'],
  },
  {
    id: 'cafe',
    title: 'At a café',
    role: 'A role play: you are a friendly barista in a small café, and the learner is a customer. Stay in the role to the end.',
    leads: true,
    plan: 'Take the order step by step: what they would like, the size or other details, here or to go, anything to eat, then the price and how they pay, and wish them a nice day. If they talk about something else, answer as a barista would and come back to the order.',
    openers: ['Hi, welcome in! What can I get for you today?', 'Good morning! Are you having it here or to go?'],
  },
  {
    id: 'interview',
    title: 'Job interview',
    role: 'A role play: you interview the learner for a job they want. Stay in the role to the end: kind, professional, and interested in their answers.',
    leads: true,
    plan: 'Ask one question at a time and never ask one twice. Find out which job it is first, if they have not said. Then go through their experience, a strength, a problem they solved, why they want this job, and whether they have questions for you. After about six questions, tell them in two or three sentences how the interview went: what came across well and what to say more about next time. Speak about what they said, never about their grammar.',
    openers: ['Thanks for coming in today. Could you tell me a little about yourself?', 'Nice to meet you. What made you apply for this job?'],
  },
  {
    id: 'work',
    title: 'My work',
    role: "This talk is about the learner's work or studies.",
    plan: 'Ask what they do, what they are working on and what is hard about it, one thing at a time. Share what you know about their field, and ask about the details.',
    openers: ['What do you do for work, or what are you studying?', 'What are you working on these days?'],
  },
]

export const topicOf = (id: string): Topic => TOPICS.find(t => t.id === id) ?? (TOPICS[0] as Topic)

/** The duck's first line for a topic: one of its openers, `pick` 0…1 choosing which. */
export function opener(id: string, pick = Math.random()): string {
  const { openers } = topicOf(id)
  return openers[Math.min(openers.length - 1, Math.floor(pick * openers.length))] as string
}
