// Names for a call's speakers from how they are spoken to: "Коля, что у тебя?"
// and the one who answers next is Коля. A guess from the words alone, so it is
// only a hint the page offers (main.ts markCall, as the names read off the
// screen); never applied by itself. Pure; the text never leaves this function.

export type Said = { speaker: string; start: number; end?: number; text: string }

/** Words that open a phrase before a comma and are no one's name. */
const STOP = new Set(
  (
    'да нет ну так вот слушай слушайте смотри смотрите короче кстати вообще ладно окей хорошо привет спасибо пожалуйста конечно наверное значит например ' +
    'получается типа блин ребята коллеги друзья итак тогда потом сейчас здесь там просто давай давайте погоди подожди стоп супер отлично класс понял поняла ' +
    'айда пошел пошёл пошли поехали погнали мелочь ясно точно угу ага извини извините простите честно вроде может возможно кажется думаю знаешь знаете понимаешь скажи скажите расскажи всем это что как ' +
    'ні ось слухай дивись дивіться коротше взагалі добре гаразд привіт дякую звісно мабуть тобто наприклад типу колеги друзі отже тоді потім зараз зачекай ' +
    'чудово зрозумів зрозуміла вибач вибачте можливо здається знаєш ' +
    'yes yeah no well so okay look listen hey hello thanks sorry sure right actually anyway guys team everyone now then also first maybe basically honestly ' +
    'great cool exactly please and but the'
  ).split(' '),
)

/** The answer counts as the one spoken to when it starts within this many seconds. */
const ANSWER_WITHIN = 15
/** The points a hint needs (`called`): one clear call, or two that may be anything. */
const ENOUGH = 2

const NAME = /^\p{Lu}\p{Ll}{2,}$/u

/**
 * The names a phrase calls someone by, each with how sure it is. Only the forms a call takes, as a name between commas
 * is as often someone spoken about ("…, было, Максим." in a real call, 2026-11-10):
 *   "Коля, что у тебя?"   the name opens the phrase: 2 (the owner, 2026-11-10: once is enough, a wrong hint is only declined);
 *   "Что скажешь, Коля?"  after a comma, closing a question or a call: 2;
 *   "Давай, Коля, расскажи" between commas: 1.
 */
function called(text: string, common: ReadonlySet<string>): Map<string, number> {
  const out = new Map<string, number>()
  for (const m of text.matchAll(/(^|[.!?…]\s+|,\s+)(\p{L}[\p{L}'’-]*)\s*([,!?])/gu)) {
    const [, before = '', word = '', after = ''] = m
    const low = word.toLowerCase()
    if (!NAME.test(word) || STOP.has(low) || common.has(low)) continue
    const inside = before.startsWith(',')
    if (!inside && after !== ',') continue
    const points = inside && after === ',' ? 1 : 2
    out.set(word, Math.max(out.get(word) ?? 0, points))
  }
  return out
}

/** Each speaker's name as the others call them: `{speaker: name}`, only where the talk says so clearly. "me" gets none. */
export function addressHints(utterances: readonly Said[]): Record<string, string> {
  // A word written small somewhere in the talk is a common word, not a name.
  const common = new Set<string>()
  for (const u of utterances) for (const m of u.text.matchAll(/\p{L}[\p{L}'’-]*/gu)) if (/^\p{Ll}/u.test(m[0])) common.add(m[0])
  const votes = new Map<string, Map<string, number>>()
  utterances.forEach((u, i) => {
    const names = called(u.text, common)
    if (!names.size) return
    const answer = utterances.slice(i + 1).find(n => n.speaker !== u.speaker)
    if (!answer || answer.start - (u.end ?? u.start) > ANSWER_WITHIN) return
    for (const [name, points] of names) {
      const of = votes.get(name) ?? new Map<string, number>()
      of.set(answer.speaker, (of.get(answer.speaker) ?? 0) + points)
      votes.set(name, of)
    }
  })
  // A name goes to the one who answered to it most, clearly more than anyone else; a speaker keeps their likeliest name.
  const picks: { speaker: string; name: string; points: number }[] = []
  for (const [name, of] of votes) {
    const [first, second] = [...of].sort((a, b) => b[1] - a[1])
    if (first && first[1] >= ENOUGH && (!second || first[1] > second[1])) picks.push({ speaker: first[0], name, points: first[1] })
  }
  const out: Record<string, string> = {}
  for (const p of picks.sort((a, b) => b.points - a.points)) if (p.speaker !== 'me' && !out[p.speaker]) out[p.speaker] = p.name
  return out
}
