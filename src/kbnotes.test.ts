import * as path from 'node:path'
import { describe, expect, it } from 'vitest'
import { best, filePassages, inside, listRows, parseNote, renamed, snippetOf, terms } from './kbnotes'

const at = new Date('2026-11-10T09:00:00Z')
const own = parseNote('/kb/Inbox/2026-11-04 1012 Button sizes.md', '---\ncreated: 2026-11-04T10:12\nduration: 00:21\nsource: voice note\ntags:\n  - "voice"\n---\n\nButton keeps three sizes.\n', at)
const mine = parseNote('/kb/tokens.md', '# Token names\n\nA token is named by its role.\n\nFor a button: button-bg-hover, never a colour name.\n', at)

describe('the knowledge base folder as notes', () => {
  it('reads a note: Tyts’s own by its front matter, the person’s by its heading', () => {
    expect(own).toMatchObject({ title: '2026-11-04 1012 Button sizes', created: '2026-11-04T10:12', made: '2026-11-04T10:12', body: 'Button keeps three sizes.' })
    expect(mine).toMatchObject({ title: 'Token names', created: at.toISOString(), made: undefined })
  })

  it('cuts a question into prefixes as the engine does', () => {
    expect(terms('что мы решили по бейджам?')).toEqual(['что', 'реши', 'бейдж'])
  })

  it('lists the notes that have every word, the newest first, the word marked', () => {
    expect(listRows([own, mine], '').map(r => r.title)).toEqual(['Token names', '2026-11-04 1012 Button sizes'])
    expect(listRows([own, mine], 'button hover')).toEqual([{ path: '/kb/tokens.md', title: 'Token names', created: at.toISOString(), snippet: '…s A token is named by its role. For a [button]: button-bg-hover, never a colour name.' }])
    expect(snippetOf('nothing here', ['button'])).toBeUndefined()
  })

  it('finds the paragraphs for a question and keeps the best within what the model reads', () => {
    const found = filePassages([own, mine], ['button', 'hover'])
    expect(found.map(p => p.text)).toEqual(['Button keeps three sizes.', 'For a button: button-bg-hover, never a colour name.'])
    expect(found[1]).toMatchObject({ id: '', file: '/kb/tokens.md', source: 'kb', at: 0 })
    expect(best(found, ['button', 'hover']).map(p => p.file)).toEqual(['/kb/tokens.md', '/kb/Inbox/2026-11-04 1012 Button sizes.md'])
    expect(best(found, ['button', 'hover'], 60)).toHaveLength(1)
  })

  it('renames inside the same folder only, and knows what is inside the folder', () => {
    expect(renamed(path.join('kb', 'a.md'), ' ../Button: rules?.md ')).toBe(path.join('kb', 'Button rules.md'))
    expect(() => renamed(path.join('kb', 'a.md'), ' / ')).toThrow()
    expect(inside('/kb', '/kb/sub/a.md')).toBe(true)
    expect(inside('/kb', '/kb/../etc/a.md')).toBe(false)
    expect(inside('/kb', '/kb/a.txt')).toBe(false)
    expect(inside('', '/a.md')).toBe(false)
  })
})
