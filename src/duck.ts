// Talk to the duck: the person speaks English and the duck answers, a few
// spoken sentences, by the same local model that checks their English
// (checker.ts; Gemma 4 E4B or 12B, run by llama.cpp's server). The duck knows
// who it is and what for, answers what it is asked with what it really knows
// (or says it does not), and speaks at the learner's level by that level's
// rules (LEVELS: a small model keeps to "sentences of ten words, the commonest
// words" far better than to "speak at A2"). It never corrects: the mistakes
// are marked under the person's own line by Check my English, so the answer
// keeps to what they meant. Only the latest turns are sent: the prompt stays
// short (no prompt cache: llama.cpp keeps none for Gemma's sliding-window
// layers), and a talk of an hour costs the same as one of a minute.

import { LLM_LANGUAGES, type LlmFiles, type LlmModel } from './llmfiles'
import { TALK_ABOUT_MAX, type TalkLevel } from './settings'
import { topicOf } from './topics'

/**
 * The turns the duck is given: its last ten answers and the person's lines
 * around them, with the topic. A practice talk keeps its thread over ten
 * exchanges (an interview's questions, what was said a few minutes ago); each
 * line more is read again with every answer (no prompt cache for Gemma's
 * sliding window layers, llmtranslator.ts), so the window stays this short.
 */
export const WINDOW = 20
/** A spoken answer is a few sentences; the cap stops a model that goes on. */
const MAX_TOKENS = 220
/** An answer on the processor with the 12B model may take a minute. */
const REQUEST_MS = 3 * 60_000

/** Who the duck talks with: their own language (a code), their English level, and what they told it about themselves. */
export type Learner = { native: string; level: TalkLevel; about: string }

/**
 * How the duck speaks at each level: rules a small model can keep, not the
 * level's name alone. Measured on 2026-11-01 (Gemma 4 E4B, ten answers each):
 * 7.1 words a sentence at A2, 8.5 at B1, 14.6 at B2; words outside the 1000
 * commonest 13 %, 17 %, 19 %.
 */
export const LEVELS: Readonly<Record<TalkLevel, string>> = {
  A2:
    'Their English is elementary (A2). Use only very common everyday words, the ones a beginner knows. Say two or three sentences in all, each short, ten words at most, one idea in each. ' +
    'Use the present simple, the past simple, the present continuous and "going to". No idioms, no slang, no phrasal verbs except the commonest ones, such as "get up" or "look at".',
  B1:
    'Their English is intermediate (B1). Use common everyday words and common phrasal verbs; if you need a less common word, say what it means in simple words. ' +
    'Keep sentences under fifteen words. Use the usual tenses. No rare idioms, no slang.',
  B2: 'Their English is upper-intermediate (B2). Speak naturally, as to a fluent speaker: longer sentences, phrasal verbs, a common idiom now and then. Avoid rare words and heavy slang.',
}

/** The duck's instructions for `learner`, on a topic. */
export function duckPrompt(learner: Learner, topic: string): string {
  const language = LLM_LANGUAGES[learner.native] ?? 'English'
  const about = learner.about.trim().slice(0, TALK_ABOUT_MAX).replace(/\s+/g, ' ')
  const { role, plan } = topicOf(topic)
  return [
    "You are the duck in Kryakl, an app on the learner's computer that helps people learn English. " +
      'You are their English conversation partner, a friend to talk with, not a teacher or a tutor: they talk with you to practise speaking. ' +
      'You are a small AI model that runs on their computer, offline: you have no internet and you do not remember earlier talks. ' +
      'Mention what you are only when they ask who or what you are.',
    `The learner's own language is ${language}.${about ? ` What they told you about themselves: "${about}"` : ''}`,
    'How you talk:\n' +
      [
        '- English only, as a friendly, curious person talks in a spoken chat: two to four sentences. No lists, no emoji, no formatting, no stage directions.',
        '- You know a lot about the world: music, films, books, science, technology, history, places, food. When they ask about something, answer it first and for real, with concrete facts: names, years, titles, what it is known for. Never dodge a question with a question.',
        '- If they name something you do not know (an app, a product, a person), say you do not know it and ask what it is. Never pretend it is you, and never make things up.',
        '- Never correct their English and never mention mistakes, grammar or words: Kryakl marks those under their lines. Answer what they meant.',
        `- If they write in ${language === 'English' ? 'another language' : `${language} or another language`}, answer in English and go on in English.`,
      ].join('\n'),
    `Their level: ${LEVELS[learner.level]}`,
    `The talk: ${role} ${plan}`,
  ].join('\n\n')
}

/** A line of the talk as the duck is given it: the person's as they said it. */
export type Said = { who: 'me' | 'duck'; text: string }

type Message = { role: 'system' | 'user' | 'assistant'; content: string }

/**
 * The messages for the duck's next answer: its instructions, then the latest
 * turns, the person's as `user` and its own as `assistant`, alternating and
 * starting with the person (a chat template may insist), so two lines of one
 * side in a row are joined and the duck's lines before the first of the
 * person's go into the instructions.
 */
export function messagesFor(turns: readonly Said[], learner: Learner, topic: string): Message[] {
  const joined: Message[] = []
  for (const turn of turns) {
    const text = turn.text.trim()
    if (!text) continue
    const role = turn.who === 'me' ? 'user' : 'assistant'
    const last = joined[joined.length - 1]
    if (last?.role === role) last.content = `${last.content} ${text}`
    else joined.push({ role, content: text })
  }
  const recent = joined.slice(-WINDOW)
  let system = duckPrompt(learner, topic)
  // The talk opens with the duck's line (a topic's opener): it stays the duck's own turn, after a greeting of the person's, as a chat
  // template wants the person first. Folded into the instructions instead ("You said before: …"), the interviewer asked it again one time in three.
  // A window cut before a line of the duck's starts at the person's next one.
  if (recent[0]?.role === 'assistant') {
    if (recent[0] === joined[0]) recent.unshift({ role: 'user', content: 'Hi!' })
    else recent.shift()
  }
  // Whether this answer asks back is decided here, not left to the model: told "about half of the time", Gemma asked in nine answers of ten, or in none.
  // It alternates with the duck's last line; in a role play the duck leads, and its plan asks.
  if (!topicOf(topic).leads) system += asked(turns) ? '\n\nThis answer: end with a thought of your own, not a question.' : '\n\nThis answer: end with one short question about them or what they think.'
  return [{ role: 'system', content: system }, ...recent]
}

/** The duck's last line asked something. */
const asked = (turns: readonly Said[]) => !![...turns].reverse().find(t => t.who === 'duck')?.text.trim().endsWith('?')

/** When the model gives nothing to say: the talk goes on. */
export const NO_ANSWER = "Sorry, I didn't quite get that. Could you say it again?"

/** The answer as the duck says it: plain text, without quotes, asterisks or a sentence cut off by the cap. */
export function spoken(content: string, cut: boolean): string {
  let text = content
    // Bold and headings lose their marks; *laughs* and (smiles) go whole: they are not said.
    .replace(/\*\*|__/g, '')
    .replace(/\*[^*\n]+\*|\([^)\n]*\)/g, '')
    .replace(/[*`]|^#+\s*/gm, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,!?])/g, '$1')
    .trim()
    .replace(/^["“](.*)["”]$/, '$1')
    .trim()
  if (cut) {
    const end = Math.max(text.lastIndexOf('. '), text.lastIndexOf('? '), text.lastIndexOf('! '))
    if (end > 0) text = text.slice(0, end + 1)
  }
  return text || NO_ANSWER
}

export type DuckOptions = {
  files: LlmFiles
  /** The model in use (the settings' `model`, the one Check my English uses), asked at each answer. */
  model: () => LlmModel
  fetch?: typeof fetch
  /** An answer done: its seconds, and the seconds it waited for the model to load, when it did. */
  onTimed?: (model: LlmModel, timed: { reply: number; start?: number }) => void
}

export type Duck = {
  /** The duck's answer to the talk so far (its last line the person's), in English. */
  reply(turns: readonly Said[], learner: Learner, topic: string, signal?: AbortSignal): Promise<string>
}

export function createDuck(o: DuckOptions): Duck {
  const { files } = o
  const post = o.fetch ?? fetch
  return {
    async reply(turns, learner, topic, signal) {
      const model = o.model()
      const began = Date.now()
      return files.server.run(files.target(model), async (base, loaded) => {
        const ready = Date.now()
        const response = await post(`${base}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${files.server.apiKey}` },
          body: JSON.stringify({
            messages: messagesFor(turns, learner, topic),
            // A little freedom: the same line twice should not get the same answer.
            temperature: 0.7,
            max_tokens: MAX_TOKENS,
            cache_prompt: false,
            chat_template_kwargs: { enable_thinking: false },
          }),
          signal: AbortSignal.any([AbortSignal.timeout(REQUEST_MS), ...(signal ? [signal] : [])]),
        })
        if (!response.ok) throw new Error(`The duck's model answered ${response.status}`)
        const data = (await response.json()) as { choices?: { message?: { content?: unknown }; finish_reason?: unknown }[] }
        const choice = data.choices?.[0]
        const content = typeof choice?.message?.content === 'string' ? choice.message.content : ''
        o.onTimed?.(model, { reply: (Date.now() - ready) / 1000, ...(loaded ? { start: (ready - began) / 1000 } : {}) })
        return spoken(content, choice?.finish_reason === 'length')
      })
    },
  }
}
