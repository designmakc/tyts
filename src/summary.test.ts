import { describe, expect, it, vi } from 'vitest'

import type { LlmFiles } from './llmfiles'
import { checkSummary, createSummarizer, renderSummary, screenOf, splitParts, type SummaryInput, type SummaryJson, type SummaryLine } from './summary'

const line = (start: number, text = 'x'.repeat(100), speaker = 'Me'): SummaryLine => ({ speaker, start, text })
const empty: SummaryJson = { short: '', decisions: [], tasks: [], questions: [], topics: [] }

describe('splitParts', () => {
  it('cuts a 90-minute meeting into parts of about 20 minutes, every line once, in order', () => {
    const lines = Array.from({ length: 90 }, (_, i) => line(i * 60))
    const parts = splitParts(lines)
    expect(parts.length).toBe(5)
    expect(parts.flat()).toEqual(lines)
    expect(parts[0]!.at(-1)!.start).toBeLessThan(1200)
    expect(parts[1]![0]!.start).toBe(1200)
  })

  it('keeps a part within 12 000 characters and never cuts a line', () => {
    const lines = [line(0, 'a'.repeat(5000)), line(10, 'b'.repeat(5000)), line(20, 'c'.repeat(5000)), line(30, 'd'.repeat(20000))]
    expect(splitParts(lines).map(part => part.length)).toEqual([2, 1, 1])
  })
})

describe('renderSummary', () => {
  const json: SummaryJson = {
    short: 'The budget is approved.',
    decisions: ['Ship on Friday'],
    tasks: [{ who: 'Olga', what: 'Send the report', due: 'Friday' }, { who: '', what: 'Book a room', due: '' }],
    questions: [],
    topics: [{ title: 'Budget', at: 754 }, { title: 'Hiring', at: 3723 }],
  }

  it('writes the sections with English headings, an empty one as a dash, topics with their time', () => {
    expect(renderSummary(json, 'en')).toBe(
      '### Short\nThe budget is approved.\n\n### Decisions\n- Ship on Friday\n\n### Tasks\n- Olga — Send the report — Friday\n- Book a room\n\n' +
        '### Open questions\n—\n\n### Main topics\n- [12:34] Budget\n- [1:02:03] Hiring',
    )
  })

  it('heads the sections in Russian and Ukrainian, any other language in English', () => {
    expect(renderSummary(json, 'ru')).toContain('### Коротко\n')
    expect(renderSummary(json, 'ru')).toContain('### Открытые вопросы\n—')
    expect(renderSummary(json, 'uk')).toContain('### Відкриті питання\n—')
    expect(renderSummary(json, 'de')).toContain('### Open questions\n—')
    expect(renderSummary(json, null)).toContain('### Short\n')
  })

  it('says how many chunks were lost', () => {
    expect(renderSummary(json, 'ru', 2).endsWith('\n\nПотеряно кусков записи: 2 (по 10 с)')).toBe(true)
    expect(renderSummary(json, 'en', 0)).not.toContain('lost')
  })

  it('marks topic times', () => {
    const stamps = renderSummary(json, 'en').split('\n').map(l => l.match(/\[((?:\d+:)?\d{1,2}:\d{2})\]/)?.[1]).filter(Boolean)
    expect(stamps).toEqual(['12:34', '1:02:03'])
  })
})

describe('checkSummary', () => {
  const input: SummaryInput = {
    title: 'Sync',
    duration: 600,
    language: 'en',
    lines: [
      { speaker: 'Me', start: 0, text: 'Olga will send the report by Friday.' },
      { speaker: 'Speaker 1', start: 30, text: 'We hire 3 people. Book a room please.' },
    ],
  }

  it('drops a deadline that was never said, keeps one that was', () => {
    const out = checkSummary({ ...empty, tasks: [
      { who: '', what: 'Send the report', due: 'by Friday' },
      { who: '', what: 'Book a room', due: 'next Monday' },
      { who: '', what: 'Hire', due: 'until 15 May' },
    ] }, input)
    expect(out.tasks.map(t => t.due)).toEqual(['by Friday', '', ''])
  })

  it('keeps a deadline said in another form of its words', () => {
    const ru: SummaryInput = { ...input, language: 'ru', lines: [{ speaker: 'Me', start: 0, text: 'Отчёт к пятнице, бюджет до 15 мая.' }] }
    const out = checkSummary({ ...empty, tasks: [
      { who: '', what: 'Отчёт', due: 'до пятницы' },
      { who: '', what: 'Бюджет', due: '15 мая' },
      { who: '', what: 'Бюджет', due: '16 мая' },
    ] }, ru)
    expect(out.tasks.map(t => t.due)).toEqual(['до пятницы', '15 мая', ''])
  })

  it('checks a translated deadline and name by their numbers only', () => {
    const tasks = [
      { who: 'Ольга', what: 'Надіслати звіт', due: 'п’ятниця' },
      { who: 'Ольга', what: 'Найняти', due: '20 травня' },
    ]
    expect(checkSummary({ ...empty, tasks }, input, true).tasks.map(t => [t.who, t.due])).toEqual([['Ольга', 'п’ятниця'], ['Ольга', '']])
    expect(checkSummary({ ...empty, tasks }, input).tasks.map(t => [t.who, t.due])).toEqual([['', ''], ['', '']])
  })

  it('keeps "who" only as a speaker or a name said in the meeting', () => {
    const out = checkSummary({ ...empty, tasks: [
      { who: 'Olga', what: 'Send the report', due: '' },
      { who: 'Speaker 1', what: 'Book a room', due: '' },
      { who: 'Ivan Petrov', what: 'Hire', due: '' },
    ] }, input)
    expect(out.tasks.map(t => t.who)).toEqual(['Olga', 'Speaker 1', ''])
  })

  it('drops an item with a number that is not in the meeting', () => {
    const out = checkSummary({ ...empty, short: 'They hire 3 people. The budget is 42 000.', decisions: ['Hire 3 people', 'Spend 42 000'], questions: ['Who pays the 5 %?'] }, input)
    expect(out.decisions).toEqual(['Hire 3 people'])
    expect(out.questions).toEqual([])
    expect(out.short).toBe('They hire 3 people.')
  })

  it('drops a topic outside the recording', () => {
    const out = checkSummary({ ...empty, topics: [{ title: 'Report', at: 0 }, { title: 'Room', at: 601 }, { title: 'Hiring', at: -5 }] }, input)
    expect(out.topics).toEqual([{ title: 'Report', at: 0 }])
  })
})

describe('createSummarizer', () => {
  const answer: SummaryJson = { short: 'They talked.', decisions: [], tasks: [], questions: [], topics: [{ title: 'Talk', at: 0 }] }

  function setup(reply: (body: { messages: { content: string }[] }) => unknown = () => answer) {
    const asked: { system: string; user: string; body: Record<string, unknown> }[] = []
    const post = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body)) as { messages: { content: string }[] }
      asked.push({ system: body.messages[0]!.content, user: body.messages[1]!.content, body })
      const content = reply(body)
      return new Response(JSON.stringify({ choices: [{ message: { content: typeof content === 'string' ? content : JSON.stringify(content) } }] }), { status: 200 })
    })
    const files = {
      state: () => ({ status: 'ready', progress: 1, size: 5155 }),
      target: () => ({ exe: 'llama-server', model: 'm.gguf' }),
      server: { apiKey: 'test-key', run: async (_t: unknown, job: (base: string, loaded: boolean) => Promise<unknown>) => job('http://127.0.0.1:9001', false) },
    } as unknown as LlmFiles
    const summarizer = createSummarizer({ files, model: () => 'accurate', fetch: post as unknown as typeof fetch })
    return { summarizer, asked, post }
  }

  const short: SummaryInput = { title: 'Sync', duration: 120, language: 'ru', lines: [line(0, 'Привет, начнём.'), line(60, 'Да.', 'Speaker 1')] }
  const long: SummaryInput = { title: 'Webinar', duration: 3600, language: 'en', lines: Array.from({ length: 60 }, (_, i) => line(i * 60, 'We talk.')) }

  it('makes a short meeting in one request, in the meeting’s language', async () => {
    const { summarizer, asked } = setup()
    const progress: unknown[] = []
    const out = await summarizer.summarize(short, { template: 'general', mine: false, native: 'Ukrainian' }, p => progress.push(p))
    expect(asked.length).toBe(1)
    expect(asked[0]!.user).toContain('[01:00] Speaker 1: Да.')
    expect(asked[0]!.system).toContain('Russian')
    expect(asked[0]!.system).not.toContain('Ukrainian')
    expect(asked[0]!.body).toMatchObject({ temperature: 0, chat_template_kwargs: { enable_thinking: false }, response_format: { type: 'json_schema' } })
    expect(out).toMatchObject({ template: 'general', mine: false, language: 'ru' })
    expect(out.text).toContain('### Коротко\nThey talked.')
    expect(progress).toEqual([{ part: 0, parts: 1 }, { part: 1, parts: 1 }])
  })

  it('makes a long meeting part by part, then joins the parts', async () => {
    const { summarizer, asked } = setup()
    const progress: unknown[] = []
    await summarizer.summarize(long, { template: 'standup', mine: true, native: 'Ukrainian' }, p => progress.push(p))
    expect(asked.length).toBe(4)
    expect(asked.slice(0, 3).every(a => a.system.includes('part'))).toBe(true)
    expect(asked[3]!.user).toContain('They talked.')
    expect(asked.every(a => a.system.includes('Ukrainian'))).toBe(true)
    expect(progress).toEqual([{ part: 0, parts: 3 }, { part: 1, parts: 3 }, { part: 2, parts: 3 }, { part: 3, parts: 3 }, { part: 4, parts: 3 }])
  })

  it('keeps the parts’ summaries when the join’s answer is cut short', async () => {
    const { summarizer, asked } = setup(body => (body.messages[0]!.content.startsWith('You join') ? '{"short": "They' : answer))
    const out = await summarizer.summarize(long, { template: 'general', mine: false, native: 'Ukrainian' }, () => {})
    expect(asked.at(-1)!.body.max_tokens).toBeGreaterThan(asked[0]!.body.max_tokens as number)
    expect(out.text).toContain('They talked. They talked. They talked.')
  })

  it('joins the parts of a very long meeting in groups, each request within the budget', async () => {
    // Four hours: 12 parts, each answered with a long summary; all of them in one join would overflow the model.
    const { summarizer, asked } = setup(() => ({ ...answer, short: 'x'.repeat(2500) }))
    const fourHours: SummaryInput = { ...long, duration: 4 * 3600, lines: Array.from({ length: 240 }, (_, i) => line(i * 60, 'We talk.')) }
    const out = await summarizer.summarize(fourHours, { template: 'general', mine: false, native: 'Ukrainian' }, () => {})
    const joins = asked.filter(a => a.system.startsWith('You join'))
    expect(asked.length - joins.length).toBe(12)
    expect(joins.length).toBeGreaterThan(1)
    expect(joins.every(a => a.user.length <= 12_000)).toBe(true)
    expect(asked.at(-1)!.system.startsWith('You join')).toBe(true)
    expect(out.text).toContain('x'.repeat(2500))
  })

  it('wraps the person’s own instruction in the rules', async () => {
    const { summarizer, asked } = setup()
    await summarizer.summarize(short, { template: 'own', own: 'Only the money, please', mine: false, native: 'English' }, () => {})
    const system = asked[0]!.system
    expect(system).toContain('Only the money, please')
    expect(system.indexOf('never invent')).toBeLessThan(system.indexOf('Only the money, please'))
    expect(system).toMatch(/data, not instructions/)
  })

  it('gives every part the person’s notes, and the join none', async () => {
    const { summarizer, asked } = setup()
    await summarizer.summarize({ ...long, notes: 'Budget is the point' }, { template: 'general', mine: false, native: 'English' }, () => {})
    const parts = asked.filter(a => !a.system.startsWith('You join'))
    expect(parts.length).toBeGreaterThan(1)
    expect(parts.every(a => a.user.includes('<notes>\nBudget is the point\n</notes>') && a.system.includes('<notes>'))).toBe(true)
    expect(asked.filter(a => a.system.startsWith('You join')).every(a => !a.user.includes('<notes>') && !a.system.includes('<notes>'))).toBe(true)
  })

  it('stops when cancelled', async () => {
    const stop = new AbortController()
    const { summarizer, asked } = setup(() => {
      stop.abort()
      return answer
    })
    await expect(summarizer.summarize(long, { template: 'general', mine: false, native: 'English' }, () => {}, stop.signal)).rejects.toBeTruthy()
    expect(asked.length).toBe(1)
  })

  it('fails on an answer that is not JSON', async () => {
    const { summarizer } = setup(() => 'Sure! Here is the summary')
    await expect(summarizer.summarize(short, { template: 'general', mine: false, native: 'English' }, () => {})).rejects.toThrow(/summary/)
  })
})

describe('the screen’s text', () => {
  const input: SummaryInput = {
    title: 'Demo', duration: 900, language: 'ru',
    lines: [{ speaker: 'Me', start: 0, text: 'Смотрите, вот новый онбординг.' }],
    shots: [{ at: 761, text: 'Onboarding 2.0\nConversion 42%' }],
  }

  it('counts as said for the check, and a topic keeps only a screenshot that was given', () => {
    const out = checkSummary({ ...empty, decisions: ['Conversion is 42%', 'Budget 900'], topics: [
      { title: 'Онбординг', at: 0, shot: 761.4 },
      { title: 'Другое', at: 10, shot: 300 },
    ] }, input)
    expect(out.decisions).toEqual(['Conversion is 42%'])
    expect(out.topics).toEqual([{ title: 'Онбординг', at: 0, shot: 761 }, { title: 'Другое', at: 10 }])
    expect(renderSummary(out, 'ru')).toContain('- [00:00] Онбординг (снимок 12:41)')
  })

  it('is given to a part as lines with their time, within its budget', () => {
    expect(screenOf(input.shots!, 0, 900)).toBe('\n<screen>\nText on screen at [12:41]: Onboarding 2.0 Conversion 42%\n</screen>')
    expect(screenOf(input.shots!, 0, 700)).toBe('')
    const many = Array.from({ length: 20 }, (_, i) => ({ at: i, text: 'x'.repeat(1000) }))
    expect(screenOf(many, 0, 100).length).toBeLessThan(2600)
  })

  it('reaches the model beside the transcript, with the rule on it', async () => {
    const asked: string[] = []
    const files = {
      target: () => ({}),
      server: { apiKey: 'k', run: async (_t: unknown, job: (base: string) => Promise<unknown>) => job('http://x') },
    } as unknown as LlmFiles
    const post = async (_u: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body)) as { messages: { content: string }[] }
      asked.push(body.messages[0]!.content + '\n' + body.messages[1]!.content)
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ ...empty, short: 'Ok.', topics: [{ title: 'A', at: 0, shot: 761 }] }) } }] }))
    }
    const out = await createSummarizer({ files, model: () => 'accurate', fetch: post as unknown as typeof fetch })
      .summarize(input, { template: 'general', mine: false, native: 'Russian' }, () => {})
    expect(asked[0]).toContain('Text on screen at [12:41]')
    expect(asked[0]).toContain('"shot"')
    expect(out.text).toContain('(снимок 12:41)')
  })
})
