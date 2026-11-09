// The clipboard through user32 itself, for what Electron's clipboard cannot
// do: keep every kind of thing on it (copied files, Office's own formats, not
// only text, HTML and a picture) to put back, mark what Kryakl puts there so
// Windows' clipboard history (Win+V) and the cloud clipboard leave it out,
// and tell one change of the clipboard from another (its sequence number).
// A text to paste is promised rather than put (Windows' delayed rendering):
// Windows asks the owner window for it (WM_RENDERFORMAT) when a program reads
// it, which tells Kryakl the paste has landed and the person's clipboard can
// go back.

import koffi from 'koffi'
import { loadLib } from './native'

const user32 = loadLib('user32.dll')
const kernel32 = loadLib('kernel32.dll')
const OpenClipboard = user32.func('bool __stdcall OpenClipboard(intptr_t hwnd)')
const CloseClipboard = user32.func('bool __stdcall CloseClipboard()')
const EmptyClipboard = user32.func('bool __stdcall EmptyClipboard()')
const EnumClipboardFormats = user32.func('uint32_t __stdcall EnumClipboardFormats(uint32_t format)')
const GetClipboardData = user32.func('intptr_t __stdcall GetClipboardData(uint32_t format)')
const SetClipboardData = user32.func('intptr_t __stdcall SetClipboardData(uint32_t format, intptr_t data)')
const GetClipboardSequenceNumber = user32.func('uint32_t __stdcall GetClipboardSequenceNumber()')
const GetClipboardOwner = user32.func('intptr_t __stdcall GetClipboardOwner()')
const GetOpenClipboardWindow = user32.func('intptr_t __stdcall GetOpenClipboardWindow()')
const GetForegroundWindow = user32.func('intptr_t __stdcall GetForegroundWindow()')
const GetWindowThreadProcessId = user32.func('uint32_t __stdcall GetWindowThreadProcessId(intptr_t hwnd, _Out_ uint32_t *pid)')
const RegisterClipboardFormatW = user32.func('uint32_t __stdcall RegisterClipboardFormatW(str16 name)')
const IsClipboardFormatAvailable = user32.func('bool __stdcall IsClipboardFormatAvailable(uint32_t format)')
const GlobalAlloc = kernel32.func('intptr_t __stdcall GlobalAlloc(uint32_t flags, uintptr_t bytes)')
const GlobalLock = kernel32.func('intptr_t __stdcall GlobalLock(intptr_t memory)')
const GlobalUnlock = kernel32.func('bool __stdcall GlobalUnlock(intptr_t memory)')
const GlobalSize = kernel32.func('uintptr_t __stdcall GlobalSize(intptr_t memory)')
const GlobalFree = kernel32.func('intptr_t __stdcall GlobalFree(intptr_t memory)')
const CopyOut = kernel32.func('void __stdcall RtlMoveMemory(void *to, intptr_t from, uintptr_t bytes)')
const CopyIn = kernel32.func('void __stdcall RtlMoveMemory(intptr_t to, const void *from, uintptr_t bytes)')

const GMEM_MOVEABLE = 0x0002
const CF_UNICODETEXT = 13
/** Formats whose data is a GDI handle or an application's private one, not memory that can be copied: CF_BITMAP, CF_METAFILEPICT, CF_PALETTE, CF_ENHMETAFILE, the display formats; Windows makes the bitmap again from the DIB kept. */
const HANDLE_FORMATS = new Set([2, 3, 9, 14, 0x80, 0x82, 0x83, 0x8e])
const isPrivate = (format: number) => format >= 0x200 && format <= 0x3ff
/** A format bigger than this is not kept (a sheet of a million cells): what is too big to keep is lost, as before. */
const MOST_BYTES = 128 * 1024 * 1024

/** The clipboard as it was: each format's bytes, in the order they were put there. */
export type ClipboardSnapshot = { format: number; data: Buffer }[]

const toBig = (value: unknown) => BigInt(value as number | bigint)

let marks: { format: number; data: Buffer }[] | undefined
/** Windows' clipboard history and cloud clipboard skip a change that carries these (learn.microsoft.com, "Clipboard formats"). */
function historyMarks(): { format: number; data: Buffer }[] {
  if (!marks) {
    const zero = Buffer.alloc(4)
    marks = [
      { format: RegisterClipboardFormatW('ExcludeClipboardContentFromMonitorProcessing') as number, data: zero },
      { format: RegisterClipboardFormatW('CanIncludeInClipboardHistory') as number, data: zero },
      { format: RegisterClipboardFormatW('CanUploadToCloudClipboard') as number, data: zero },
    ]
  }
  return marks
}

let privateFormats: number[] | undefined
/**
 * The clipboard holds what its program asked others not to watch: a password manager's copy (KeePass,
 * 1Password and others put these marks on a password). Kryakl then neither shows nor reads it.
 */
export function privateCopy(): boolean {
  privateFormats ??= ['ExcludeClipboardContentFromMonitorProcessing', 'Clipboard Viewer Ignore'].map(name => RegisterClipboardFormatW(name) as number)
  return privateFormats.some(format => !!IsClipboardFormatAvailable(format))
}

export function sequence(): number {
  return GetClipboardSequenceNumber() as number
}

/** Runs `work` with the clipboard open; throws when another program holds it (the caller tries again). */
function opened<T>(owner: bigint, work: () => T): T {
  if (!OpenClipboard(owner)) throw new Error('another program holds the clipboard')
  try {
    return work()
  } finally {
    CloseClipboard()
  }
}

/** Every format on the clipboard with its bytes. */
export function snapshot(owner: bigint): ClipboardSnapshot {
  return opened(owner, () => {
    const out: ClipboardSnapshot = []
    for (let format = EnumClipboardFormats(0) as number; format !== 0; format = EnumClipboardFormats(format) as number) {
      if (HANDLE_FORMATS.has(format) || isPrivate(format)) continue
      const memory = toBig(GetClipboardData(format))
      if (memory === 0n) continue
      const size = Number(GlobalSize(memory))
      if (size === 0 || size > MOST_BYTES) continue
      const at = toBig(GlobalLock(memory))
      if (at === 0n) continue
      try {
        const data = Buffer.alloc(size)
        CopyOut(data, at, size)
        out.push({ format, data })
      } finally {
        GlobalUnlock(memory)
      }
    }
    return out
  })
}

function put(format: number, data: Buffer): void {
  const memory = toBig(GlobalAlloc(GMEM_MOVEABLE, Math.max(data.length, 1)))
  if (memory === 0n) throw new Error('no memory for the clipboard')
  const at = toBig(GlobalLock(memory))
  CopyIn(at, data, data.length)
  GlobalUnlock(memory)
  // The clipboard owns the memory once it takes it; it is freed here only when refused.
  if (toBig(SetClipboardData(format, memory)) === 0n) GlobalFree(memory)
}

/** The text promised to the clipboard, until a program reads it. */
let promised: { owner: bigint; data: Buffer } | undefined

/** Puts `formats` on the clipboard in place of what is there (nothing: an empty clipboard), and `promise` as text to hand over when read; marked to stay out of the clipboard history. */
function replace(owner: bigint, formats: ClipboardSnapshot, promise?: Buffer): void {
  // Opened without a window, the clipboard would be emptied and refuse the rest.
  if (owner === 0n) throw new Error('no window to own the clipboard')
  promised = undefined
  opened(owner, () => {
    if (!EmptyClipboard()) throw new Error('the clipboard could not be emptied')
    if (formats.length === 0 && !promise) return
    if (promise) {
      SetClipboardData(CF_UNICODETEXT, 0)
      promised = { owner, data: promise }
    }
    const marked = new Set(historyMarks().map(m => m.format))
    for (const { format, data } of formats) if (!marked.has(format)) put(format, data)
    for (const { format, data } of historyMarks()) put(format, data)
  })
}

/** Puts back what `snapshot` kept. */
export function restore(owner: bigint, saved: ClipboardSnapshot): void {
  replace(owner, saved)
}

/** Puts `text` on the clipboard, out of the clipboard history; `paste`: promised, handed over by `render` when a program reads it. */
export function writeText(owner: bigint, text: string, paste = false): void {
  const data = Buffer.from(text + '\0', 'utf16le')
  if (paste) replace(owner, [], data)
  else replace(owner, [{ format: CF_UNICODETEXT, data }])
}

function processOf(hwnd: bigint): number | undefined {
  if (hwnd === 0n) return undefined
  const pid = [0]
  GetWindowThreadProcessId(hwnd, pid)
  return pid[0] || undefined
}

/** While a program asks for the promised text: its process (when it opened the clipboard with a window of its own), and the process in front. */
export function readers(): { reader?: number; front?: number } {
  const reader = processOf(toBig(GetOpenClipboardWindow()))
  const front = processOf(toBig(GetForegroundWindow()))
  return { ...(reader !== undefined ? { reader } : {}), ...(front !== undefined ? { front } : {}) }
}

/**
 * A program reads the promised text (WM_RENDERFORMAT to the owner window):
 * it is handed over, without opening the clipboard, as Windows asks. Asked
 * for another text format, the text is given all the same: Windows makes the
 * others from it. True when there was a promise to keep. Not called, the
 * reader gets nothing and the text stays promised: Windows asks again at the
 * next read.
 */
export function render(): boolean {
  const p = promised
  if (!p) return false
  promised = undefined
  put(CF_UNICODETEXT, p.data)
  return true
}

/** The owner window is going while its text is still promised (WM_RENDERALLFORMATS): handed over for good, if the clipboard is still Kryakl's. */
export function renderAll(): void {
  const p = promised
  if (!p) return
  promised = undefined
  if (!OpenClipboard(p.owner)) return
  try {
    if (toBig(GetClipboardOwner()) === p.owner) put(CF_UNICODETEXT, p.data)
  } finally {
    CloseClipboard()
  }
}
