// A Windows library through koffi, or, on another system, a stand-in whose
// every function does nothing and returns 0: the features built on it are off
// there, and the rest of Kryakl runs.

import koffi from 'koffi'

type Lib = ReturnType<typeof koffi.load>

const missing = { func: () => () => 0 } as unknown as Lib

export const loadLib = (name: string): Lib => (process.platform === 'win32' ? koffi.load(name) : missing)
