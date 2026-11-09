import { describe, expect, test } from 'vitest'

import { changed, frameHash, hamming, keyShots, nameIn, pointsAtScreen, SHOT_SIDE, shotAt, shownShots, speakerHints } from './shots'

/** A SHOT_SIDE² RGBA picture whose pixel i has the brightness `at(i)`. */
const picture = (at: (i: number) => number) => {
  const out = new Uint8ClampedArray(SHOT_SIDE * SHOT_SIDE * 4)
  for (let i = 0; i < SHOT_SIDE * SHOT_SIDE; i++) out.set([at(i), at(i), at(i), 255], i * 4)
  return out
}

describe('a call screenshot', () => {
  const left = picture(i => (i % SHOT_SIDE < 8 ? 250 : 10))
  test('the same frame, or one a little brighter, is not new', () => {
    expect(changed(frameHash(left), frameHash(left))).toBe(false)
    expect(changed(frameHash(left), frameHash(picture(i => (i % SHOT_SIDE < 8 ? 255 : 30))))).toBe(false)
  })
  test('a new slide is', () => {
    const top = frameHash(picture(i => (i < 128 ? 250 : 10)))
    expect(hamming(frameHash(left), top)).toBe(128)
    expect(changed(frameHash(left), top)).toBe(true)
  })
  test('the first frame is always kept', () => {
    expect(changed(undefined, frameHash(left))).toBe(true)
  })
  test('the transcript shows the person’s and the key ones, by time', () => {
    const shots = [
      { at: 9, file: '9000.jpg', key: true },
      { at: 4, file: '4000.jpg' },
      { at: 2, file: '2000-m.jpg', manual: true },
    ]
    expect(shownShots(shots).map(s => s.file)).toEqual(['2000-m.jpg', '9000.jpg'])
    expect(shownShots(undefined)).toEqual([])
  })
})

describe('key frames', () => {
  test('a line that points at the screen, in three languages', () => {
    for (const text of ['Вот тут видно график', 'Смотрите, что получилось', 'Ось тут кнопка', 'Подивіться на це', 'As you can see, it works', 'Let me show you', 'it’s right here'])
      expect(pointsAtScreen(text), text).toBe(true)
    for (const text of ['Я тут подумал', 'Здесь всё понятно', 'I was here yesterday', 'посмотрим завтра', 'screenshots later']) expect(pointsAtScreen(text), text).toBe(false)
  })
  const shots = [{ at: 10, file: '10000.jpg' }, { at: 50, file: '50000.jpg' }, { at: 100, file: '100000.jpg' }]
  test('the shot of a moment: the last before it within 30 s, else the first after within 10 s', () => {
    expect(shotAt(shots, 30)?.file).toBe('10000.jpg')
    expect(shotAt(shots, 45)?.file).toBe('50000.jpg')
    expect(shotAt(shots, 79)?.file).toBe('50000.jpg')
    expect(shotAt(shots, 85)).toBeUndefined()
    expect(shotAt(shots, 5)?.file).toBe('10000.jpg')
  })
  test('key shots are those of the pointing lines, once each', () => {
    const lines = [{ start: 12, text: 'Смотрите' }, { start: 20, text: 'вот тут' }, { start: 60, text: 'обычная фраза' }, { start: 101, text: 'as you can see' }]
    expect(keyShots(shots, lines)).toEqual(['10000.jpg', '100000.jpg'])
  })
})

describe('speaker names from the tiles', () => {
  test('a name is two or three capitalized words, never a button', () => {
    expect(nameIn('Olga Petrova')).toBe('Olga Petrova')
    expect(nameIn('Ольга Петрова (Host)')).toBe('Ольга Петрова')
    expect(nameIn('Share Screen')).toBeNull()
    expect(nameIn('Olga')).toBeNull()
    expect(nameIn('Meeting ID 123')).toBeNull()
    expect(nameIn('the quick fox')).toBeNull()
  })
  test('the name seen near a speaker more than near the others', () => {
    const seen = {
      S1: [['Olga Petrova', 'Chat'], ['Olga Petrova'], ['Ivan Sidorov']],
      S2: [['Ivan Sidorov', 'Leave'], ['Ivan Sidorov']],
    }
    expect(speakerHints(seen)).toEqual({ S1: 'Olga Petrova', S2: 'Ivan Sidorov' })
  })
  test('a gallery, where every name is always seen, gives no hint', () => {
    const all = ['Olga Petrova', 'Ivan Sidorov']
    expect(speakerHints({ S1: [all, all], S2: [all] })).toEqual({})
  })
})
