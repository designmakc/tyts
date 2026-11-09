// A question to the recorded calls, answered by the person's local model from the passages the
// engine's full-text search finds (`GET /ask`, engine/calls.py): nothing but those passages, each
// cited as [n], so the page can open the call at that moment. The question's own language is answered in.

import type { LlmFiles, LlmModel } from './llmfiles'

/** What the engine finds for a question. */
export type Passage = { id: string; title: string; created: string; at: number; text: string }
export type Answer = { text: string; sources: Passage[] }

const MAX_TOKENS = 600
const REQUEST_MS = 3 * 60_000
export const CITE = /\[(\d{1,2})\]/g

export function askPrompt(): string {
  return [
    'You answer a question about the person\'s recorded calls and meetings from the passages given, and from nothing else.',
    'Each passage is marked [n] and names the call, its date and the moment. Say plainly what was said or decided, and by whom when the passage says so.',
    'Cite the passages you use as [n] right after the sentence they support. Answer in the language of the question, in a few sentences, no heading.',
    'If the passages do not answer the question, say so in one sentence and name the closest thing they do say.',
  ].join(' ')
}

export function passagesText(passages: Passage[]): string {
  return passages
    .map((p, i) => `[${i + 1}] ${p.title} · ${p.created.slice(0, 10)} · ${clock(p.at)}\n${p.text}`)
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
  ask(question: string, passages: Passage[]): Promise<Answer>
} {
  const post = o.fetch ?? fetch
  return {
    async ask(question, passages) {
      const text = await o.files.server.run(o.files.target(o.model()), async base => {
        const response = await post(`${base}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${o.files.server.apiKey}` },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: askPrompt() },
              { role: 'user', content: `<passages>\n${passagesText(passages)}\n</passages>\n\nQuestion: ${question}` },
            ],
            temperature: 0,
            max_tokens: MAX_TOKENS,
            chat_template_kwargs: { enable_thinking: false },
          }),
          signal: AbortSignal.timeout(REQUEST_MS),
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
