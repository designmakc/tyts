// Kryakl's keyboard helper on a Mac: a CGEventTap that tells Node (src/kbdmac-worker.ts)
// each key and click as a JSON line on stdout, and waits a moment for its answer
// whether to keep a key from the program (the key that ends a word being fixed, a
// key of Kryakl's). It types what Node asks (`press`), switches the input source
// (`select`), says whether the focused field is a password (`field`), plays a
// sound. Never a letter typed goes anywhere but this pipe: it logs nothing.
// `kbd-mac layouts` prints the keyboard layouts and exits.
// npm run dist:mac builds it into vendor/kbd-mac.

import AppKit
import ApplicationServices
import Carbon

/** Kryakl's own keys, and the person's keys pressed again after a fix (winkbd.ts OWN_KEYS, REPLAY_KEYS). */
let OWN: Int64 = 0x2a7a
let REPLAY: Int64 = 0x2a7b
/** An answer later than this lets the key go on: the tap must never hold typing up. */
let ANSWER_MS = 120

/** The keys that type a character, whose characters each layout reports. */
let TYPING: [Int] = Array(0...50).filter { $0 != 36 && $0 != 48 }

let out = FileHandle.standardOutput
let outLock = NSLock()
func emit(_ object: [String: Any]) {
  guard let data = try? JSONSerialization.data(withJSONObject: object) else { return }
  outLock.lock()
  out.write(data)
  out.write("\n".data(using: .utf8)!)
  outLock.unlock()
}

// ---------------------------------------------------------------- layouts

func prop(_ source: TISInputSource, _ key: CFString) -> AnyObject? {
  guard let p = TISGetInputSourceProperty(source, key) else { return nil }
  return Unmanaged<AnyObject>.fromOpaque(p).takeUnretainedValue()
}

func sourceId(_ source: TISInputSource) -> String { prop(source, kTISPropertyInputSourceID) as? String ?? "" }

/** What a key types in a layout, with Shift or not; nil for a dead key or one that types nothing. */
func charOf(_ layout: UnsafePointer<UCKeyboardLayout>, _ code: Int, _ shift: Bool) -> String? {
  var dead: UInt32 = 0
  var length = 0
  var chars = [UniChar](repeating: 0, count: 4)
  let status = UCKeyTranslate(layout, UInt16(code), UInt16(kUCKeyActionDown), shift ? UInt32(shiftKey >> 8) & 0xff : 0, UInt32(LMGetKbdType()), OptionBits(kUCKeyTranslateNoDeadKeysBit), &dead, 4, &length, &chars)
  guard status == noErr, length == 1, chars[0] >= 0x20, chars[0] != 0x7f else { return nil }
  return String(utf16CodeUnits: chars, count: 1)
}

func layouts() -> [[String: Any]] {
  let filter = [kTISPropertyInputSourceCategory: kTISCategoryKeyboardInputSource!, kTISPropertyInputSourceIsSelectCapable: true] as CFDictionary
  guard let list = TISCreateInputSourceList(filter, false)?.takeRetainedValue() as? [TISInputSource] else { return [] }
  var result: [[String: Any]] = []
  for source in list {
    // An input method (Japanese, Pinyin) has no key layout of its own: left out.
    guard let data = prop(source, kTISPropertyUnicodeKeyLayoutData) as? Data else { continue }
    var keys: [String: [String]] = [:]
    data.withUnsafeBytes { raw in
      let layout = raw.bindMemory(to: UCKeyboardLayout.self).baseAddress!
      for code in TYPING {
        keys[String(code)] = [charOf(layout, code, false) ?? "", charOf(layout, code, true) ?? ""]
      }
    }
    let langs = prop(source, kTISPropertyInputSourceLanguages) as? [String] ?? []
    result.append(["id": sourceId(source), "name": prop(source, kTISPropertyLocalizedName) as? String ?? "", "lang": langs.first ?? "", "keys": keys])
  }
  return result
}

func currentSource() -> String { sourceId(TISCopyCurrentKeyboardInputSource().takeRetainedValue()) }

func select(_ id: String) {
  let filter = [kTISPropertyInputSourceID: id] as CFDictionary
  guard let list = TISCreateInputSourceList(filter, false)?.takeRetainedValue() as? [TISInputSource], let source = list.first else { return }
  TISSelectInputSource(source)
}

if CommandLine.arguments.dropFirst().first == "layouts" {
  print(String(data: try! JSONSerialization.data(withJSONObject: layouts()), encoding: .utf8)!)
  exit(0)
}

// An app with no Dock icon and no menu: AppKit's connection keeps the program in front up to date.
_ = NSApplication.shared
NSApp.setActivationPolicy(.prohibited)

// ---------------------------------------------------------------- the answers

/** The tap waits for one answer at a time (it runs on the main thread). */
let answerLock = NSLock()
var waitingFor = -1
var answer = false
let answered = DispatchSemaphore(value: 0)
var seq = 0

func ask(_ object: [String: Any]) -> Bool {
  seq += 1
  answerLock.lock()
  // An answer that came after its key gave up is dropped, or it would answer this one.
  while answered.wait(timeout: .now()) == .success {}
  waitingFor = seq
  answer = false
  answerLock.unlock()
  var o = object
  o["n"] = seq
  o["w"] = true
  emit(o)
  // ponytail: a late answer lets the key through while Node may count it kept; rare, Node is a thread doing nothing else.
  let got = answered.wait(timeout: .now() + .milliseconds(ANSWER_MS)) == .success
  answerLock.lock()
  waitingFor = -1
  let keep = got && answer
  answerLock.unlock()
  return keep
}

// ---------------------------------------------------------------- typing

let poster = CGEventSource(stateID: .privateState)
func post(_ code: Int, _ down: Bool, mark: Int64, text: String? = nil, flags: CGEventFlags = []) {
  guard let e = CGEvent(keyboardEventSource: poster, virtualKey: CGKeyCode(code), keyDown: down) else { return }
  e.setIntegerValueField(.eventSourceUserData, value: mark)
  e.flags = flags
  if let text {
    let units = Array(text.utf16)
    e.keyboardSetUnicodeString(stringLength: units.count, unicodeString: units)
  }
  e.post(tap: .cghidEventTap)
}

func press(_ keys: [[String: Any]]) {
  for key in keys {
    if let code = key["k"] as? Int {
      // `cmd`: Cmd held with it (Kryakl's own Cmd+V, never seen by the tap as the person's).
      let flags: CGEventFlags = (key["cmd"] as? Bool ?? false) ? .maskCommand : []
      post(code, true, mark: OWN, flags: flags)
      post(code, false, mark: OWN, flags: flags)
    } else if let text = key["t"] as? String {
      for ch in text {
        post(0, true, mark: OWN, text: String(ch))
        post(0, false, mark: OWN, text: String(ch))
      }
    } else if let code = key["r"] as? Int {
      // A key of the person's typed while a fix was on its way, pressed again as theirs, with the modifiers held now.
      post(code, !(key["u"] as? Bool ?? false), mark: REPLAY, flags: CGEventSource.flagsState(.hidSystemState))
    }
  }
}

var sound: NSSound?
func secretField() -> Any {
  if IsSecureEventInputEnabled() { return true }
  var focused: AnyObject?
  guard AXUIElementCopyAttributeValue(AXUIElementCreateSystemWide(), kAXFocusedUIElementAttribute as CFString, &focused) == .success, let element = focused else { return NSNull() }
  var subrole: AnyObject?
  AXUIElementCopyAttributeValue(element as! AXUIElement, kAXSubroleAttribute as CFString, &subrole)
  return (subrole as? String) == "AXSecureTextField"
}

Thread {
  while let line = readLine() {
    guard let data = line.data(using: .utf8), let c = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any], let command = c["c"] as? String else { continue }
    if command == "r" {
      answerLock.lock()
      if (c["n"] as? Int) == waitingFor {
        answer = c["s"] as? Bool ?? false
        answered.signal()
      }
      answerLock.unlock()
      continue
    }
    DispatchQueue.main.async {
      switch command {
      case "press": press(c["keys"] as? [[String: Any]] ?? [])
      case "select": select(c["id"] as? String ?? "")
      case "field": emit(["e": "field", "secret": secretField()])
      case "sound":
        sound = NSSound(contentsOfFile: c["path"] as? String ?? "", byReference: true)
        sound?.play()
      default: break
      }
    }
  }
  // Node is gone.
  exit(0)
}.start()

// ---------------------------------------------------------------- the tap

/** Each modifier key's own bit in the event's flags (NX_DEVICE…KEYMASK), so left and right are told apart. */
let SIDE: [Int: UInt64] = [55: 0x08, 54: 0x10, 56: 0x02, 60: 0x04, 58: 0x20, 61: 0x40, 59: 0x01, 62: 0x2000]
var tap: CFMachPort?

func onEvent(_ type: CGEventType, _ event: CGEvent) -> Bool {
  if type == .tapDisabledByTimeout || type == .tapDisabledByUserInput {
    if let tap { CGEvent.tapEnable(tap: tap, enable: true) }
    return false
  }
  let mark = event.getIntegerValueField(.eventSourceUserData)
  if mark == OWN { return false }
  // A key another program posted (not the keyboard itself, nor Kryakl's replay).
  let foreign = mark != REPLAY && event.getIntegerValueField(.eventSourceStateID) != Int64(CGEventSourceStateID.hidSystemState.rawValue)
  let code = Int(event.getIntegerValueField(.keyboardEventKeycode))
  let caps = event.flags.contains(.maskAlphaShift)
  switch type {
  case .keyDown, .keyUp:
    let e: [String: Any] = ["e": "k", "c": code, "d": type == .keyDown, "caps": caps, "f": foreign, "src": currentSource()]
    if foreign { emit(e); return false }
    return ask(e)
  case .flagsChanged:
    // A modifier is never kept from the program: kept, it would stay held for it.
    if code == 57 {
      emit(["e": "k", "c": code, "d": true, "caps": caps, "f": foreign])
      emit(["e": "k", "c": code, "d": false, "caps": caps, "f": foreign])
    } else if let bit = SIDE[code] {
      emit(["e": "k", "c": code, "d": event.flags.rawValue & bit != 0, "caps": caps, "f": foreign])
    }
    return false
  default:
    let p = event.location
    let t = Int(event.timestamp / 1_000_000)
    var name = ""
    var button = 0
    switch type {
    case .leftMouseDown: name = "left-down"
    case .leftMouseUp: name = "left-up"
    case .rightMouseDown: name = "other-down"
    case .scrollWheel: name = "wheel"
    case .otherMouseDown, .otherMouseUp:
      let n = event.getIntegerValueField(.mouseEventButtonNumber)
      // 3 and 4 are the side buttons, back and forward.
      if n == 3 || n == 4 { name = type == .otherMouseDown ? "x-down" : "x-up"; button = Int(n) - 2 } else if type == .otherMouseDown { name = "other-down" }
    default: break
    }
    if !name.isEmpty { emit(["e": "m", "t": name, "x": Int(p.x), "y": Int(p.y), "time": t, "b": button]) }
    return false
  }
}

func startTap() -> Bool {
  let types: [CGEventType] = [.keyDown, .keyUp, .flagsChanged, .leftMouseDown, .leftMouseUp, .rightMouseDown, .otherMouseDown, .otherMouseUp, .scrollWheel]
  let mask = types.reduce(CGEventMask(0)) { $0 | (1 << $1.rawValue) }
  guard let port = CGEvent.tapCreate(tap: .cgSessionEventTap, place: .headInsertEventTap, options: .defaultTap, eventsOfInterest: mask, callback: { _, type, event, _ in
    onEvent(type, event) ? nil : Unmanaged.passUnretained(event)
  }, userInfo: nil) else { return false }
  tap = port
  CFRunLoopAddSource(CFRunLoopGetMain(), CFMachPortCreateRunLoopSource(nil, port, 0), .commonModes)
  CGEvent.tapEnable(tap: port, enable: true)
  return true
}

// What macOS lets this process do, told in hello and ready (tyts.log): keys reach a tap only with Input Monitoring (ListenEvent).
func access() -> [String: Any] { ["listen": CGPreflightListenEventAccess(), "post": CGPreflightPostEventAccess(), "ax": AXIsProcessTrusted()] }
emit(["e": "hello", "dbl": Int(NSEvent.doubleClickInterval * 1000), "layouts": layouts(), "access": access()])

// The program in front and the input source, looked at a few times a second; a change is told.
var front: (Int32, String) = (0, "")
var source = ""
Timer.scheduledTimer(withTimeInterval: 0.25, repeats: true) { _ in
  if let app = NSWorkspace.shared.frontmostApplication, app.processIdentifier != front.0 {
    front = (app.processIdentifier, (app.executableURL?.lastPathComponent ?? app.localizedName ?? "").lowercased())
    emit(["e": "app", "pid": front.0, "name": front.1])
  }
  let now = currentSource()
  if now != source {
    source = now
    emit(["e": "src", "id": now])
  }
}

// Without Accessibility the tap cannot keep a key, without Input Monitoring it sees only modifiers:
// macOS is asked once for each (its own prompts), then looked at every 2 s; the tap is made again once keys are allowed.
let axAtStart = AXIsProcessTrustedWithOptions([kAXTrustedCheckOptionPrompt.takeUnretainedValue(): true] as CFDictionary)
var listening = CGPreflightListenEventAccess()
if !listening { _ = CGRequestListenEventAccess() }
func ready() { emit(["e": "ready", "access": access()]) }
if axAtStart, startTap() {
  if listening { ready() } else { emit(["e": "noInput", "access": access()]) }
} else {
  emit(["e": "denied", "access": access()])
}
if tap == nil || !listening {
  Timer.scheduledTimer(withTimeInterval: 2, repeats: true) { timer in
    if tap == nil {
      guard AXIsProcessTrusted(), startTap() else { return }
      if listening { timer.invalidate(); return ready() }
      emit(["e": "noInput", "access": access()])
    }
    guard CGPreflightListenEventAccess() else { return }
    listening = true
    timer.invalidate()
    // ponytail: keyDown filtering may be fixed when the tap is made, so it is made afresh.
    if let old = tap { CGEvent.tapEnable(tap: old, enable: false); CFMachPortInvalidate(old); tap = nil }
    if startTap() { ready() }
  }
}

// Layouts added or removed in System Settings are told again.
DistributedNotificationCenter.default().addObserver(forName: NSNotification.Name(kTISNotifyEnabledKeyboardInputSourcesChanged as String), object: nil, queue: .main) { _ in
  emit(["e": "layouts", "list": layouts()])
}

RunLoop.main.run()
