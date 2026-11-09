// Tyts's clipboard watcher on a Mac, for Ctrl+C twice (there ⌘C twice): a Mac
// tells nobody when the pasteboard changes, so its change count is looked at every
// 20 ms, and each change is one line on stdout, 1 when Command is held at that
// moment, else 0, then " concealed" when a password manager marked the copy
// (nspasteboard.org's concealed or transient type; the clipboard history leaves
// it out) (src/winclip.ts watchClipboardMac). It ends when stdin closes:
// Tyts is gone. npm run dist:mac builds it into vendor/clip-mac.

import AppKit
setvbuf(stdout, nil, _IOLBF, 0)
var last = NSPasteboard.general.changeCount
Timer.scheduledTimer(withTimeInterval: 0.02, repeats: true) { _ in
  let now = NSPasteboard.general.changeCount
  if now == last { return }
  last = now
  let command = CGEventSource.flagsState(.combinedSessionState).contains(.maskCommand)
  let hidden = (NSPasteboard.general.types ?? []).contains { $0.rawValue == "org.nspasteboard.ConcealedType" || $0.rawValue == "org.nspasteboard.TransientType" }
  print((command ? "1" : "0") + (hidden ? " concealed" : ""))
  fflush(stdout)
}
FileHandle.standardInput.readabilityHandler = { h in if h.availableData.isEmpty { exit(0) } }
RunLoop.main.run()
