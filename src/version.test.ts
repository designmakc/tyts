import { describe, expect, test } from 'vitest'

import { isBeta, versionText } from './version'

describe('the beta', () => {
  test('lasts while the version is 0.x', () => {
    expect(isBeta('0.15.2')).toBe(true)
    expect(isBeta('1.0.0')).toBe(false)
    expect(isBeta('10.2.0')).toBe(false)
  })

  test('is said after the number', () => {
    expect(versionText('0.15.2')).toBe('0.15.2 beta')
    expect(versionText('1.0.0')).toBe('1.0.0')
  })
})
