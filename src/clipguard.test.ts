import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { AFTER_READ_MS, ClipboardGuard, READ_WAIT_MS, type ClipboardBackend } from './clipguard'

/** A clipboard of one text, counting its changes as Windows does. */
function fakeClipboard(text = 'mine') {
  const state = { text, sequence: 1, busy: 0, writes: 0 }
  const change = (next: string) => {
    state.text = next
    state.sequence++
  }
  const backend: ClipboardBackend<string> = {
    sequence: () => state.sequence,
    snapshot: () => state.text,
    restore: saved => {
      if (state.busy > 0 && state.busy--) throw new Error('held')
      state.writes++
      change(saved)
    },
    writeText: (next: string) => {
      if (state.busy > 0 && state.busy--) throw new Error('held')
      state.writes++
      change(next)
    },
  }
  return { state, change, backend }
}

const noWait = () => Promise.resolve()

describe('ClipboardGuard', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  test('a paste: Kryakl’s text goes in, what the person had comes back after', async () => {
    const clip = fakeClipboard()
    const guard = new ClipboardGuard(clip.backend, noWait)
    guard.hold()
    await guard.write('translation')
    expect(clip.state.text).toBe('translation')
    guard.release(500)
    await vi.advanceTimersByTimeAsync(500)
    expect(clip.state.text).toBe('mine')
    expect(guard.isOurs()).toBe(true)
  })

  test('two actions close together keep the first snapshot, not Kryakl’s own text', async () => {
    const clip = fakeClipboard()
    const guard = new ClipboardGuard(clip.backend, noWait)
    guard.hold()
    await guard.write('ghbdtn')
    guard.release(500)
    await vi.advanceTimersByTimeAsync(200)
    guard.hold()
    await guard.write('привет')
    guard.release(500)
    await vi.advanceTimersByTimeAsync(500)
    expect(clip.state.text).toBe('mine')
  })

  test('a copy the person makes meanwhile stays', async () => {
    const clip = fakeClipboard()
    const guard = new ClipboardGuard(clip.backend, noWait)
    guard.hold()
    await guard.write('translation')
    guard.release(500)
    clip.change('their new copy')
    await vi.advanceTimersByTimeAsync(500)
    expect(clip.state.text).toBe('their new copy')
    expect(guard.isOurs()).toBe(false)
  })

  test('nothing copied: nothing is written', async () => {
    const clip = fakeClipboard()
    const guard = new ClipboardGuard(clip.backend, noWait)
    guard.hold()
    guard.release(0)
    await vi.advanceTimersByTimeAsync(0)
    expect(clip.state.writes).toBe(0)
  })

  test('a copy Kryakl pressed is claimed and taken back', async () => {
    const clip = fakeClipboard()
    const guard = new ClipboardGuard(clip.backend, noWait)
    guard.hold()
    clip.change('the selection')
    guard.claim()
    await guard.putBack()
    expect(clip.state.text).toBe('mine')
  })

  test('another program holding the clipboard: tried again', async () => {
    const clip = fakeClipboard()
    const guard = new ClipboardGuard(clip.backend, noWait)
    guard.hold()
    clip.state.busy = 2
    await guard.write('translation')
    clip.state.busy = 2
    await guard.putBack()
    expect(clip.state.text).toBe('mine')
  })

  test('a paste: back a moment after the program reads it, however long it takes', async () => {
    const clip = fakeClipboard()
    const guard = new ClipboardGuard(clip.backend, noWait)
    guard.hold()
    await guard.write('translation', true)
    guard.pasted()
    guard.release()
    await vi.advanceTimersByTimeAsync(1500)
    expect(clip.state.text).toBe('translation')
    guard.read()
    await vi.advanceTimersByTimeAsync(AFTER_READ_MS)
    expect(clip.state.text).toBe('mine')
  })

  test('read before the release (a paste with more keys after it): back a moment after the release', async () => {
    const clip = fakeClipboard()
    const guard = new ClipboardGuard(clip.backend, noWait)
    guard.hold()
    await guard.write('https://example.com', true)
    guard.pasted()
    guard.read()
    guard.release()
    await vi.advanceTimersByTimeAsync(AFTER_READ_MS)
    expect(clip.state.text).toBe('mine')
  })

  test('never read: back after the longest wait; read before Ctrl+V (a clipboard program) does not count', async () => {
    const clip = fakeClipboard()
    const guard = new ClipboardGuard(clip.backend, noWait)
    guard.hold()
    await guard.write('translation', true)
    guard.read()
    guard.pasted()
    guard.release()
    await vi.advanceTimersByTimeAsync(READ_WAIT_MS - 1)
    expect(clip.state.text).toBe('translation')
    await vi.advanceTimersByTimeAsync(1)
    expect(clip.state.text).toBe('mine')
  })

  test('a program watching the clipboard gets nothing, before Ctrl+V and after, unless it is the one pasted into', async () => {
    const clip = fakeClipboard()
    const guard = new ClipboardGuard(clip.backend, noWait)
    const viber = 18196
    const editor = 4104
    guard.hold()
    await guard.write('translation', true)
    expect(guard.read(viber, editor)).toBe(false)
    expect(guard.read(undefined, editor)).toBe(false)
    guard.pasted()
    guard.release()
    expect(guard.read(viber, editor)).toBe(false)
    expect(guard.read(editor, editor)).toBe(true)
    await vi.advanceTimersByTimeAsync(AFTER_READ_MS)
    expect(clip.state.text).toBe('mine')

    // Pasting into Viber itself.
    guard.hold()
    await guard.write('translation', true)
    expect(guard.read(viber, viber)).toBe(false)
    guard.pasted()
    expect(guard.read(viber, viber)).toBe(true)
  })

  test('nothing written to paste: back at once', async () => {
    const clip = fakeClipboard()
    const guard = new ClipboardGuard(clip.backend, noWait)
    guard.hold()
    await guard.write('a marker')
    guard.release()
    await vi.advanceTimersByTimeAsync(0)
    expect(clip.state.text).toBe('mine')
  })

  test('a copy the person makes while the paste is awaited stays', async () => {
    const clip = fakeClipboard()
    const guard = new ClipboardGuard(clip.backend, noWait)
    guard.hold()
    await guard.write('translation', true)
    guard.pasted()
    guard.release()
    // Their copy takes the promise away: no read comes.
    clip.change('their new copy')
    await vi.advanceTimersByTimeAsync(READ_WAIT_MS)
    expect(clip.state.text).toBe('their new copy')
  })

  test('on quitting, what waits goes back at once; dropped, nothing does', async () => {
    const clip = fakeClipboard()
    const guard = new ClipboardGuard(clip.backend, noWait)
    guard.hold()
    await guard.write('translation')
    guard.release(500)
    guard.flush()
    expect(clip.state.text).toBe('mine')
    await vi.advanceTimersByTimeAsync(500)
    expect(clip.state.writes).toBe(2)

    guard.hold()
    clip.change('a snip')
    guard.drop()
    await guard.putBack()
    expect(clip.state.text).toBe('a snip')
    expect(guard.holding).toBe(false)
  })
})
