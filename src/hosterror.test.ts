import { expect, it } from 'vitest'
import { hostReason } from './hosterror'

it('gives a page the reason a call failed, without Electron’s wrapper', () => {
  expect(hostReason("Error invoking remote method 'host-call': Error: needModel")).toBe('needModel')
  expect(hostReason("Error invoking remote method 'host-call': AbortError: This operation was aborted")).toBe('This operation was aborted')
  expect(hostReason("Error invoking remote method 'host-call': The model answered 500")).toBe('The model answered 500')
  expect(hostReason('Choose a knowledge base folder first')).toBe('Choose a knowledge base folder first')
})
