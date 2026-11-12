// A question to the recorded calls and the notes, answered by the person's local model from the
// passages found: the engine's full-text search of the transcripts (`GET /ask`, engine/calls.py) and,
// on the Notes page, the knowledge base folder's files (kbnotes.ts). Nothing but those passages, each
// cited as [n], so the page can open the call at that moment or the note at that paragraph. The
// question's own language is answered in.

import type { LlmFiles, LlmModel } from './llmfiles'

/** What is found for a question: a piece of a transcript (`id`, at the moment `at`), or of a note file (`file`). `source`: how it was made, 'kb' a file. */
export type Passage = { id: string; title: string; created: string; at: number; text: string; file?: string; source?: string }
export type Answer = { text: string; sources: Passage[] }
/** Where a question to the notes looks: everywhere, the dictated notes, the recordings, the knowledge base folder's files. */
export type NoteScope = 'all' | 'note' | 'call' | 'kb'
/** A question asked before in the same conversation, and what was answered. */
export type Turn = { question: string; answer: string }

const MAX_TOKENS = 600
const REQUEST_MS = 3 * 60_000
/** How many earlier turns of a conversation go with a question: enough to follow "and who was against it?". */
const TURNS = 2
export const CITE = /\[(\d{1,2})\]/g

export function askPrompt(): string {
  return [
    'You answer a question about the person\'s notes, recorded calls and meetings from the passages given, and from nothing else.',
    'Each passage is marked [n] and names the note or the call, its date and, for a call, the moment. Say plainly what was said or decided, and by whom when the passage says so.',
    'Cite the passages you use as [n] right after the sentence they support. Answer in the language of the question, in a few sentences, no heading.',
    'If the passages do not answer the question, say so in one sentence and name the closest thing they do say.',
  ].join(' ')
}

export function passagesText(passages: Passage[]): string {
  return passages
    .map((p, i) => `[${i + 1}] ${p.title} · ${p.created.slice(0, 10)}${p.file ? '' : ` · ${clock(p.at)}`}\n${p.text}`)
    .join('\n\n')
}

/** The passages the answer cites, in the order cited, as numbers from 1. */
export function cited(text: string, count: number): number[] {
  const out: number[] = []
  for (const m of text.matchAll(CITE)) {
    const n = Number(m[1])
    if (n >= 1 && n <= count && !out.includes(n)) out.push(n)
  }
  return out
}

function clock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return `${h ? `${h}:` : ''}${String(m).padStart(h ? 2 : 1, '0')}:${String(s % 60).padStart(2, '0')}`
}

export function createAsker(o: { files: LlmFiles; model: () => LlmModel; fetch?: typeof fetch }): {
  /** `before`: the conversation so far (the last turns are sent, their citations taken out: they numbered other passages). */
  ask(question: string, passages: Passage[], before?: Turn[], stop?: AbortSignal): Promise<Answer>
} {
  const post = o.fetch ?? fetch
  return {
    async ask(question, passages, before = [], stop) {
      const text = await o.files.server.run(o.files.target(o.model()), async base => {
        const response = await post(`${base}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${o.files.server.apiKey}` },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: askPrompt() },
              ...before.slice(-TURNS).flatMap(turn => [
                { role: 'user', content: turn.question },
                { role: 'assistant', content: turn.answer.replace(CITE, '').slice(0, 1500) },
              ]),
              { role: 'user', content: `<passages>\n${passagesText(passages)}\n</passages>\n\nQuestion: ${question}` },
            ],
            temperature: 0,
            max_tokens: MAX_TOKENS,
            chat_template_kwargs: { enable_thinking: false },
          }),
          signal: AbortSignal.any([AbortSignal.timeout(REQUEST_MS), ...(stop ? [stop] : [])]),
        })
        if (!response.ok) throw new Error(`The model answered ${response.status}`)
        const data = (await response.json()) as { choices?: { message?: { content?: unknown } }[] }
        const content = data.choices?.[0]?.message?.content
        return typeof content === 'string' ? content.trim() : ''
      })
      return { text, sources: passages }
    },
  }
}
