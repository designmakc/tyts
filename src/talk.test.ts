import { describe, expect, it, vi } from 'vitest'

import type { CheckOutcome } from './checker'
import type { Said } from './duck'
import { Talk } from './talk'

/** A promise to settle by hand. */
function later<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => ((resolve = res), (reject = rej)))
  return { promise, resolve, reject }
}

const tick = () => new Promise(resolve => setTimeout(resolve, 0))

function setup() {
  const checks: { text: string; done: ReturnType<typeof later<CheckOutcome>> }[] = []
  const replies: { turns: readonly Said[]; topic: string; signal: AbortSignal; done: ReturnType<typeof later<string>> }[] = []
  const mistakes: string[][] = []
  const onChange = vi.fn()
  const talk = new Talk({
    check: text => {
      const done = later<CheckOutcome>()
      checks.push({ text, done })
      return done.promise
    },
    reply: (turns, topic, signal) => {
      const done = later<string>()
      replies.push({ turns, topic, signal, done })
      return done.promise
    },
    mistake: (text, corrected, note) => mistakes.push([text, corrected, note]),
    onChange,
    opener: topic => `Let's talk: ${topic}`,
  })
  return { talk, checks, replies, mistakes, onChange }
}

describe('Talk', () => {
  it('goes on from a talk kept before: its turns, its topic, the next line numbered after them', () => {
    const { talk, replies } = setup()
    talk.restore({ topic: 'trip', turns: [{ id: 1, who: 'duck', text: 'Where did you go?' }, { id: 7, who: 'me', text: 'To Rome.', checking: true }] })
    expect(talk.state()).toMatchObject({ topic: 'trip', status: 'idle' })
    expect(talk.state().turns[1]).not.toHaveProperty('checking')
    talk.say('It was hot.')
    expect(talk.state().turns.at(-1)).toMatchObject({ id: 8, who: 'me', text: 'It was hot.' })
    expect(replies[0]!.topic).toBe('trip')
    expect(replies[0]!.turns).toHaveLength(3)
  })

  it('starts a topic with the duck’s first line', () => {
    const { talk } = setup()
    talk.start('trip')
    expect(talk.state()).toMatchObject({ topic: 'trip', status: 'idle', turns: [{ id: 1, who: 'duck', text: "Let's talk: trip" }] })
  })

  it('checks the line and asks the duck at once; the marks and the answer come as each is ready', async () => {
    const { talk, checks, replies, mistakes } = setup()
    talk.start('free')
    talk.say('  I goed   home. ')
    expect(talk.state()).toMatchObject({ status: 'thinking', turns: [{ who: 'duck' }, { who: 'me', text: 'I goed home.', checking: true }] })
    // The duck is given the line as said, mistakes and all.
    expect(checks.map(c => c.text)).toEqual(['I goed home.'])
    expect(replies[0]?.turns).toEqual([
      { who: 'duck', text: "Let's talk: free" },
      { who: 'me', text: 'I goed home.' },
    ])
    checks[0]!.done.resolve({ corrected: 'I went home.', note: 'goed → went' })
    await tick()
    const me = talk.state().turns[1]!
    expect(me).toMatchObject({ checking: false, corrected: 'I went home.', note: 'goed → went' })
    expect(me.parts?.map(p => p.kind)).toContain('del')
    expect(mistakes).toEqual([['I goed home.', 'I went home.', 'goed → went']])
    replies[0]!.done.resolve('Welcome back! How was it?')
    await tick()
    expect(talk.state()).toMatchObject({ status: 'idle', turns: [{}, {}, { who: 'duck', text: 'Welcome back! How was it?' }] })
  })

  it('marks nothing on a right line', async () => {
    const { talk, checks, mistakes } = setup()
    talk.say('I went home.')
    checks[0]!.done.resolve({ corrected: 'I went home.', note: '' })
    await tick()
    expect(talk.state().turns[0]).toEqual({ id: 1, who: 'me', text: 'I went home.', checking: false })
    expect(mistakes).toEqual([])
  })

  it('drops the answer under way when the person speaks again or interrupts', async () => {
    const { talk, replies } = setup()
    talk.say('Hello.')
    talk.interrupt()
    expect(replies[0]!.signal.aborted).toBe(true)
    expect(talk.state().status).toBe('idle')
    replies[0]!.done.resolve('Too late')
    await tick()
    expect(talk.state().turns.map(t => t.who)).toEqual(['me'])
    talk.say('Are you there?')
    talk.say('Hello?')
    expect(replies[1]!.signal.aborted).toBe(true)
    replies[2]!.done.resolve('Yes, I am here!')
    await tick()
    expect(talk.state().turns.map(t => t.text)).toEqual(['Hello.', 'Are you there?', 'Hello?', 'Yes, I am here!'])
  })

  it('says when the duck could not answer, and keeps the line', async () => {
    const { talk, replies, checks } = setup()
    talk.say('Hello.')
    replies[0]!.done.reject(new Error('The duck’s model answered 500'))
    checks[0]!.done.reject(new Error('no model'))
    await tick()
    expect(talk.state()).toMatchObject({ status: 'failed', message: 'The duck’s model answered 500', turns: [{ text: 'Hello.', checking: false }] })
    talk.clear()
    expect(talk.state()).toEqual({ turns: [], status: 'idle', topic: 'free' })
  })
})
