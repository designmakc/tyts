import { describe, expect, it, vi } from 'vitest'

import { checkPrompt, createChecker, lostWords } from './checker'
import type { LlmFiles } from './llmfiles'

describe('checkPrompt', () => {
  it('asks for the note in the person’s language, with an example where there is one', () => {
    const ru = checkPrompt('ru')
    expect(ru).toContain('whose own language is Russian')
    expect(ru).toContain('"note": in Russian')
    expect(ru).toContain('после can глагол стоит в начальной форме')
    expect(checkPrompt('de')).toContain('"note": in German, one short sentence')
    expect(checkPrompt('de')).not.toContain('for example')
    // A language the model does not know: English.
    expect(checkPrompt('xx')).toContain('whose own language is English')
  })
})

describe('lostWords', () => {
  it('lets a correction drop a word or two, never a part of the text', () => {
    expect(lostWords('I am agree with you.', 'I agree with you.')).toBe(false)
    expect(lostWords('you show my my mistake', 'you show me my mistakes')).toBe(false)
    expect(lostWords('He said me that he will come. I am interesting in design, and the deadline is in monday.', 'He told me that he will come.')).toBe(true)
  })
})

describe('createChecker', () => {
  function setup(answers: Record<string, { corrected: string; note: string } | string>) {
    const asked: { system: string; text: string; body: Record<string, unknown>; auth: string | null }[] = []
    const post = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body)) as { messages: { content: string }[] }
      const [system, user] = body.messages
      asked.push({ system: system!.content, text: user!.content, body, auth: new Headers(init.headers).get('authorization') })
      const answer = answers[user!.content] ?? { corrected: user!.content, note: '' }
      return new Response(JSON.stringify({ choices: [{ message: { content: typeof answer === 'string' ? answer : JSON.stringify(answer) } }] }), { status: 200 })
    })
    const files = {
      state: () => ({ status: 'ready', progress: 1, size: 5155 }),
      prepare: vi.fn(async () => undefined),
      target: () => ({ exe: 'llama-server.exe', model: 'check.gguf' }),
      server: { apiKey: 'test-key', run: async (_t: unknown, job: (base: string, loaded: boolean) => Promise<unknown>) => job('http://127.0.0.1:9001', true) },
    } as unknown as LlmFiles
    const timed: { model: string; text: number; start?: number }[] = []
    const checker = createChecker({ files, model: () => 'most', fetch: post as unknown as typeof fetch, onTimed: (model, t) => timed.push({ model, ...t }) })
    return { checker, asked, timed }
  }

  it('gives the corrected text and the note, the spaces around it kept', async () => {
    const { checker, asked, timed } = setup({
      'Think abot this idea.': { corrected: 'Think about this idea.', note: 'abot → about: опечатка.' },
    })
    expect(await checker.check('  Think abot this idea.\n', 'ru')).toEqual({ corrected: '  Think about this idea.\n', note: 'abot → about: опечатка.' })
    expect(asked[0]?.system).toContain('whose own language is Russian')
    // The server answers only requests with its key (llama.ts apiKey).
    expect(asked[0]?.auth).toBe('Bearer test-key')
    expect(asked[0]?.body).toMatchObject({ temperature: 0, chat_template_kwargs: { enable_thinking: false }, response_format: { type: 'json_schema' } })
    expect(timed[0]).toMatchObject({ model: 'most' })
    expect(timed[0]?.start).toBeGreaterThanOrEqual(0)
  })

  it('keeps a right text as it is, without a note, however the model spaced it', async () => {
    const { checker } = setup({ 'For example.': { corrected: 'For  example.', note: 'Всё верно.' } })
    expect(await checker.check('For example.', 'ru')).toEqual({ corrected: 'For example.', note: '' })
  })

  it('checks each line on its own, keeps a line the model lost, and says when it gave no answer', async () => {
    const { checker, asked } = setup({
      'He go home.': { corrected: 'He goes home.', note: 'go → goes' },
      'She said me that she will come and bring the slides.': { corrected: 'She told me.', note: 'said → told' },
      broken: 'not json',
    })
    const out = await checker.check('He go home.\n\nShe said me that she will come and bring the slides.', 'ru')
    // The blank line is not asked about.
    expect(asked.map(a => a.text)).toEqual(['He go home.', 'She said me that she will come and bring the slides.'])
    expect(out).toEqual({ corrected: 'He goes home.\n\nShe said me that she will come and bring the slides.', note: 'go → goes' })
    await expect(checker.check('broken', 'ru')).rejects.toThrow('The checker gave no answer')
  })
})
