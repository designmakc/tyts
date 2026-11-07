import { expect, test } from 'vitest'

import { policyArgs } from './speechport'

test('the extension is told a moved port and the default clears it', () => {
  expect(policyArgs(8766)).toEqual(['add', expect.stringContaining('phokhlmnodckgejnaogjgpmfjnjkefpa\\policy'), '/v', 'port', '/t', 'REG_DWORD', '/d', '8766', '/f'])
  expect(policyArgs(8765)[0]).toBe('delete')
})
