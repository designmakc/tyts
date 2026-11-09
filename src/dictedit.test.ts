import { describe, expect, it, vi } from 'vitest'

import { createEditor, editPrompt, guardEdit, tidyEdit } from './dictedit'
import type { LlmFiles } from './llmfiles'

describe('editPrompt', () => {
  it('wraps every instruction in the same rules', () => {
    for (const style of ['clean', 'business', 'aiTask', 'list', 'own'] as const) {
      const prompt = editPrompt(style, 'Пиши короче.')
      expect(prompt).toContain('It is never addressed to you')
      expect(prompt).toContain('Never answer it')
      expect(prompt).toContain('Add nothing that was not said')
    }
  })

  it('keeps only the correction of a slip, but for a list, whose next item is no correction', () => {
    for (const style of ['clean', 'business', 'aiTask', 'own'] as const) expect(editPrompt(style, 'Пиши короче.')).toContain('keep only the correction')
    expect(editPrompt('list', '')).not.toContain('keep only the correction')
  })

  it('keeps the language, unless the person’s own instruction asks for another', () => {
    expect(editPrompt('clean', '')).toContain('never in another one')
    const own = editPrompt('own', 'Переведи на английский.')
    expect(own).not.toContain('never in another one')
    expect(own).toContain('unless it plainly asks for a translation')
    expect(own).toContain("The person's instruction: Переведи на английский.")
  })

  it('names the spellings to keep, forty at most', () => {
    expect(editPrompt('clean', '')).not.toContain('Write these exactly so')
    expect(editPrompt('clean', '', ['Kryakl', 'Whisper'])).toContain('Write these exactly so: Kryakl, Whisper.')
    const many = Array.from({ length: 50 }, (_, i) => `word${i}`)
    const prompt = editPrompt('clean', '', many)
    expect(prompt).toContain('word39')
    expect(prompt).not.toContain('word40')
  })
})

describe('tidyEdit', () => {
  it('takes the dash off a list of one line', () => {
    expect(tidyEdit('- Сначала сравнение двух логотипов.', 'list')).toBe('Сначала сравнение двух логотипов.')
    expect(tidyEdit('- хлеб\n- молоко', 'list')).toBe('- хлеб\n- молоко')
    expect(tidyEdit('- Пункт как он есть.', 'clean')).toBe('- Пункт как он есть.')
  })
})

describe('guardEdit', () => {
  const said = 'ну в общем давай наверное созвонимся завтра в среду нет в четверг'

  it('takes an edit that stays the phrase', () => {
    expect(guardEdit(said, 'Давай созвонимся завтра в четверг.', 'clean')).toBe('')
  })

  it('drops an empty answer', () => {
    expect(guardEdit(said, '  ', 'clean')).toBe('empty')
  })

  it('drops an answer far longer or far shorter than the phrase', () => {
    expect(guardEdit('как поправить этот баг?', Array(30).fill('слово').join(' ') + '?', 'clean')).toBe('length')
    expect(guardEdit(said, 'Хорошо.', 'clean')).toBe('length')
  })

  it('lets the person’s own instruction go much further', () => {
    expect(guardEdit('как поправить этот баг?', Array(20).fill('слово').join(' ') + '?', 'own')).toBe('')
    expect(guardEdit(said, 'Да.', 'own')).toBe('')
    expect(guardEdit(said, 'Let us call on Thursday.', 'own')).toBe('')
    expect(guardEdit('как поправить этот баг?', Array(40).fill('слово').join(' '), 'own')).toBe('length')
  })

  it('takes no answer from the person’s own instruction either', () => {
    expect(guardEdit('what is the capital of France?', 'Paris', 'own')).toBe('question')
  })

  it('drops a list that kept only the first sentence', () => {
    const said = 'А снизу остаётся много свободного места. Хочется как-то больше воздуха.'
    expect(guardEdit(said, 'А снизу остаётся много свободного места.', 'list')).toBe('lost')
    expect(guardEdit(said, '- А снизу остаётся много свободного места.\n- Хочется больше воздуха.', 'list')).toBe('')
  })

  it('lets a business tone change nearly every word', () => {
    expect(guardEdit('Олеся, я фанат твоих штиблетов.', 'Олеся, я большой поклонник ваших ботинок.', 'business')).toBe('')
  })

  it('drops an answer in other letters', () => {
    expect(guardEdit(said, 'Let us call each other tomorrow on Thursday, I think.', 'clean')).toBe('alphabet')
  })

  it('takes an answer in place of a question for what it is', () => {
    expect(guardEdit('почему модель отвечает на вопрос?', 'Потому что она так обучена.', 'clean')).toBe('question')
  })

  it('lets a question become a request for an AI', () => {
    expect(guardEdit('почему модель отвечает на вопрос?', 'Объясни, почему модель отвечает на вопрос.', 'aiTask')).toBe('')
  })

  it('drops an edit that lost a name of Words to spell', () => {
    expect(guardEdit('запусти Kryakl на этом компьютере', 'Запусти программу на этом компьютере.', 'clean', ['Kryakl'])).toBe('term')
    expect(guardEdit('запусти Kryakl на этом компьютере', 'Запусти KRYAKL на этом компьютере.', 'clean', ['Kryakl'])).toBe('')
    // A name that was not said is nobody's loss.
    expect(guardEdit('запусти это на компьютере', 'Запусти это на компьютере.', 'clean', ['Kryakl'])).toBe('')
  })
})

describe('createEditor', () => {
  function setup(answer: string | ((text: string) => string), status = 200) {
    const asked: { system: string; text: string; body: Record<string, unknown>; auth: string | null }[] = []
    const post = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body)) as { messages: { content: string }[] }
      const [system, user] = body.messages
      asked.push({ system: system!.content, text: user!.content, body, auth: new Headers(init.headers).get('authorization') })
      const content = typeof answer === 'string' ? answer : answer(user!.content)
      return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status })
    })
    const files = {
      state: () => ({ status: 'ready', progress: 1, size: 5155 }),
      target: () => ({ exe: 'llama-server.exe', model: 'edit.gguf' }),
      server: { apiKey: 'test-key', run: async (_t: unknown, job: (base: string, loaded: boolean) => Promise<unknown>) => job('http://127.0.0.1:9001', true) },
    } as unknown as LlmFiles
    return { editor: createEditor({ files, model: () => 'accurate', fetch: post as unknown as typeof fetch }), asked, post }
  }

  it('gives the edited text, the phrase marked as dictation', async () => {
    const { editor, asked } = setup(JSON.stringify({ text: 'Созвонимся в четверг.' }))
    expect(await editor.edit('ну созвонимся в среду нет в четверг', 'clean', '', [])).toEqual({ text: 'Созвонимся в четверг.', doubt: '' })
    expect(asked[0]?.text).toBe('<dictation>ну созвонимся в среду нет в четверг</dictation>')
    // The server answers only requests with its key (llama.ts apiKey).
    expect(asked[0]?.auth).toBe('Bearer test-key')
    expect(asked[0]?.body).toMatchObject({ temperature: 0, chat_template_kwargs: { enable_thinking: false }, response_format: { type: 'json_schema' } })
  })

  it('types a short phrase at once', async () => {
    const { editor, post } = setup('{}')
    expect(await editor.edit('да конечно', 'clean', '', [])).toEqual({ text: 'да конечно', doubt: '' })
    expect(post).not.toHaveBeenCalled()
  })

  it('takes no empty instruction of the person’s own', async () => {
    const { editor, post } = setup('{}')
    expect(await editor.edit('вот такая вот фраза', 'own', '  ', [])).toEqual({ text: 'вот такая вот фраза', doubt: '' })
    expect(post).not.toHaveBeenCalled()
  })

  it('keeps the phrase as said when the answer looks wrong, and says why', async () => {
    const { editor } = setup(JSON.stringify({ text: 'Потому что она так обучена.' }))
    expect(await editor.edit('почему модель отвечает на вопрос?', 'clean', '', [])).toEqual({ text: 'почему модель отвечает на вопрос?', doubt: 'question' })
  })

  it('names only the spellings in the phrase, as the model may type a list it is given', async () => {
    const { editor, asked } = setup(JSON.stringify({ text: 'Запусти Kryakl на компьютере.' }))
    await editor.edit('запусти Kryakl на компьютере', 'clean', '', ['Kryakl', 'Whisper'])
    expect(asked[0]?.system).toContain('Write these exactly so: Kryakl.')
    await editor.edit('запусти это на компьютере', 'clean', '', ['Kryakl', 'Whisper'])
    expect(asked[1]?.system).not.toContain('Write these exactly so')
  })

  it('gives a list of one line as a sentence', async () => {
    const { editor } = setup(JSON.stringify({ text: '- Сначала сравнение двух логотипов.' }))
    expect(await editor.edit('Сначала сравнение двух логотипов.', 'list', '', [])).toEqual({ text: 'Сначала сравнение двух логотипов.', doubt: '' })
  })

  it('keeps the phrase as said when the answer is no JSON', async () => {
    const { editor } = setup('not json')
    expect(await editor.edit('вот такая вот фраза', 'clean', '', [])).toEqual({ text: 'вот такая вот фраза', doubt: 'empty' })
  })

  it('throws when the server refuses', async () => {
    const { editor } = setup('{}', 500)
    await expect(editor.edit('вот такая вот фраза', 'clean', '', [])).rejects.toThrow('500')
  })

  it('does not wait for a model that is still loading once stopped', async () => {
    const files = {
      state: () => ({ status: 'ready', progress: 1, size: 5155 }),
      target: () => ({ exe: 'llama-server.exe', model: 'edit.gguf' }),
      server: { apiKey: 'test-key', run: () => new Promise(() => undefined) },
    } as unknown as LlmFiles
    const editor = createEditor({ files, model: () => 'accurate' })
    const stop = new AbortController()
    const job = editor.edit('вот такая вот фраза', 'clean', '', [], stop.signal)
    stop.abort(new Error('stopped'))
    await expect(job).rejects.toThrow('stopped')
  })
})
