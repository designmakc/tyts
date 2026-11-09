import { describe, expect, it, vi } from 'vitest'

import { createDuck, duckPrompt, LEVELS, messagesFor, NO_ANSWER, spoken, WINDOW, type Learner, type Said } from './duck'
import type { LlmFiles } from './llmfiles'
import { opener, TOPICS } from './topics'

const learner = (native: string, more: Partial<Learner> = {}): Learner => ({ native, level: 'B1', about: '', ...more })

describe('duckPrompt', () => {
  it('says who the duck is, keeps to English, never corrects, and names the learner’s language and the talk', () => {
    const ru = duckPrompt(learner('ru'), 'cafe')
    expect(ru).toContain('You are the duck in Kryakl')
    expect(ru).toContain('not a teacher or a tutor')
    expect(ru).toContain('you have no internet')
    expect(ru).toContain("The learner's own language is Russian.")
    expect(ru).toContain('Never correct their English')
    expect(ru).toContain('If they write in Russian or another language')
    expect(ru).toContain('say you do not know it')
    expect(ru).toContain('friendly barista')
    // A language the model does not know, a topic that is not there: English, free talk.
    expect(duckPrompt(learner('xx'), 'nope')).toContain("The learner's own language is English.")
    expect(duckPrompt(learner('xx'), 'nope')).toContain('If they write in another language')
    expect(duckPrompt(learner('en'), 'nope')).toContain('This is a free talk about anything.')
  })

  it('speaks by the level’s rules and knows what the learner told about themselves', () => {
    for (const level of ['A2', 'B1', 'B2'] as const) expect(duckPrompt(learner('ru', { level }), 'free')).toContain(LEVELS[level])
    expect(duckPrompt(learner('ru', { level: 'A2' }), 'free')).toContain('ten words at most')
    expect(duckPrompt(learner('ru'), 'free')).not.toContain('told you about themselves')
    const told = duckPrompt(learner('ru', { about: '  I am Alex,\n a designer.  ' }), 'free')
    expect(told).toContain('What they told you about themselves: "I am Alex, a designer."')
    // A long note is cut, as the settings keep it.
    expect(duckPrompt(learner('ru', { about: 'x'.repeat(900) }), 'free')).not.toContain('x'.repeat(501))
  })
})

describe('opener', () => {
  it('starts each topic with one of its own lines', () => {
    for (const topic of TOPICS) {
      expect(topic.openers).toContain(opener(topic.id, 0))
      expect(topic.openers).toContain(opener(topic.id, 0.999))
    }
    expect(opener('cafe', 0)).toBe('Hi, welcome in! What can I get for you today?')
    expect(opener('nope', 0)).toBe(TOPICS[0]!.openers[0])
  })
})

describe('messagesFor', () => {
  it('gives the instructions first, then the turns in roles, starting with the person', () => {
    const turns: Said[] = [
      { who: 'duck', text: 'Hi! What would you like to talk about today?' },
      { who: 'me', text: 'I want talk about my trip.' },
    ]
    const m = messagesFor(turns, learner('uk'), 'free')
    // The duck's opener stays its own turn, after a greeting of the person's: the chat template wants the person first.
    expect(m.slice(1)).toEqual([
      { role: 'user', content: 'Hi!' },
      { role: 'assistant', content: 'Hi! What would you like to talk about today?' },
      { role: 'user', content: 'I want talk about my trip.' },
    ])
    expect(m[0]!.role).toBe('system')
    expect(m[0]!.content).not.toContain('You said before')
  })

  it('joins two lines of one side in a row, and sends only the latest turns', () => {
    const turns: Said[] = [
      { who: 'me', text: 'Hello.' },
      { who: 'me', text: 'Are you there?' },
      { who: 'duck', text: 'Yes!' },
    ]
    expect(messagesFor(turns, learner('en'), 'free').slice(1)).toEqual([
      { role: 'user', content: 'Hello. Are you there?' },
      { role: 'assistant', content: 'Yes!' },
    ])
    // A window cut before a line of the duck's starts at the person's next one.
    const long: Said[] = Array.from({ length: 30 }, (_, i) => ({ who: i % 2 ? 'me' : 'duck', text: `line ${i}` }))
    const sent = messagesFor(long, learner('en'), 'free').slice(1)
    expect(sent).toHaveLength(WINDOW - 1)
    expect(sent[0]).toEqual({ role: 'user', content: 'line 11' })
    expect(sent[sent.length - 1]!.content).toBe('line 29')
  })

  it('asks back every other answer in a free talk, and leaves a role play to its plan', () => {
    const after = (duck: string): Said[] => [
      { who: 'duck', text: duck },
      { who: 'me', text: 'I like jazz.' },
    ]
    const system = (turns: Said[], topic: string) => messagesFor(turns, learner('ru'), topic)[0]!.content
    expect(system(after('What music do you like?'), 'free')).toContain('end with a thought of your own, not a question')
    expect(system(after('Jazz is great.'), 'free')).toContain('end with one short question')
    expect(system(after('Jazz is great.'), 'interview')).not.toContain('This answer:')
  })
})

describe('spoken', () => {
  it('says the answer as plain text', () => {
    expect(spoken('"Oh, **nice**! *smiles* Where did you go (in summer)?"', false)).toBe('Oh, nice! Where did you go?')
    expect(spoken('That sounds fun. What did you eat there? I would love to hear ab', true)).toBe('That sounds fun. What did you eat there?')
    expect(spoken('  ', false)).toBe(NO_ANSWER)
  })
})

describe('createDuck', () => {
  function setup(content: string, finish = 'stop') {
    const asked: { body: Record<string, unknown>; auth: string | null; signal: AbortSignal | undefined }[] = []
    const post = vi.fn(async (_url: string, init: RequestInit) => {
      asked.push({ body: JSON.parse(String(init.body)) as Record<string, unknown>, auth: new Headers(init.headers).get('authorization'), signal: init.signal ?? undefined })
      return new Response(JSON.stringify({ choices: [{ message: { content }, finish_reason: finish }] }), { status: 200 })
    })
    const files = {
      target: () => ({ exe: 'llama-server.exe', model: 'gemma.gguf' }),
      server: { apiKey: 'test-key', run: async (_t: unknown, job: (base: string, loaded: boolean) => Promise<unknown>) => job('http://127.0.0.1:9001', true) },
    } as unknown as LlmFiles
    const timed: { model: string; reply: number; start?: number }[] = []
    const duck = createDuck({ files, model: () => 'accurate', fetch: post as unknown as typeof fetch, onTimed: (model, t) => timed.push({ model, ...t }) })
    return { duck, asked, timed }
  }

  it('asks the model with its key, without thinking, and times the answer', async () => {
    const { duck, asked, timed } = setup('Nice! Where did you go?')
    const stop = new AbortController()
    expect(await duck.reply([{ who: 'me', text: 'I was on a trip.' }], learner('ru'), 'trip', stop.signal)).toBe('Nice! Where did you go?')
    expect(asked[0]?.auth).toBe('Bearer test-key')
    expect(asked[0]?.body).toMatchObject({ temperature: 0.7, max_tokens: 220, chat_template_kwargs: { enable_thinking: false } })
    // The page's stop reaches the request.
    stop.abort()
    expect(asked[0]?.signal?.aborted).toBe(true)
    expect(timed[0]).toMatchObject({ model: 'accurate' })
    expect(timed[0]?.start).toBeGreaterThanOrEqual(0)
  })

  it('cuts an answer the cap stopped at its last whole sentence', async () => {
    const { duck } = setup('Cool. Tell me more about it, I am really curi', 'length')
    expect(await duck.reply([{ who: 'me', text: 'I like cats.' }], learner('en'), 'free')).toBe('Cool.')
  })
})
