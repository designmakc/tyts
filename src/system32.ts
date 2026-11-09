// Windows' own programs by their full path. A bare name ("powershell.exe") is
// looked for in the current folder and on PATH first, where another program
// could have put one of the same name.

import * as path from 'node:path'

export const system32 = (...parts: string[]): string => path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', ...parts)

/** The path module for a path as written: Windows' for `C:\…` or `\\server\…`, so a Windows path read from a file or a process list is understood on any OS (the tests run on Linux too). */
export const pathOf = (p: string): path.PlatformPath => (/^[a-zA-Z]:[\\/]|^\\\\/.test(p) ? path.win32 : path)

export const POWERSHELL = system32('WindowsPowerShell', 'v1.0', 'powershell.exe')
