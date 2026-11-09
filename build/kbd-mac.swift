// Kryakl's keyboard helper on a Mac: a CGEventTap that tells Node (src/kbdmac-worker.ts)
// each key and click as a JSON line on stdout, and waits a moment for its answer
// whether to keep a key from the program (the key that ends a word being fixed, a
// key of Kryakl's). It types what Node asks (`press`), switches the input source
// (`select`), says whether the focused field is a password (`field`), plays a
// sound, says where the text cursor is (`caret`) and whether there is a selection (`sel`), turns Caps Lock over, says when
// the program in front fills a screen (`full`). Never a letter typed goes anywhere
// but this pipe: it logs nothing.
// `kbd-mac layouts` prints the keyboard layouts and exits; `kbd-mac caret` prints
// the text cursor's place in the program in front (try `sleep 3; kbd-mac caret`);
// `kbd-mac sel` whether it has a selection and where (never the text).
// npm run dist:mac builds it into vendor/kbd-mac.

import AppKit
import ApplicationServices
import Carbon
import IOKit.hid

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

// ---------------------------------------------------------------- the text cursor

func ax(_ element: AXUIElement, _ attribute: String) -> AnyObject? {
  var value: AnyObject?
  return AXUIElementCopyAttributeValue(element, attribute as CFString, &value) == .success ? value : nil
}

func axRect(_ value: AnyObject?, _ type: AXValueType) -> AXValue? {
  guard let value, CFGetTypeID(value) == AXValueGetTypeID(), AXValueGetType(value as! AXValue) == type else { return nil }
  return (value as! AXValue)
}

/** Where a range of a field's text is drawn, in points from the main screen's top left (as Electron's screen counts); nil for none or an empty one. */
func boundsOf(_ element: AXUIElement, _ location: Int, _ length: Int) -> CGRect? {
  var range = CFRange(location: location, length: length)
  guard let param = AXValueCreate(.cfRange, &range) else { return nil }
  var out: AnyObject?
  guard AXUIElementCopyParameterizedAttributeValue(element, kAXBoundsForRangeParameterizedAttribute as CFString, param, &out) == .success, let value = axRect(out, .cgRect) else { return nil }
  var rect = CGRect.zero
  guard AXValueGetValue(value, .cgRect, &rect), rect.height > 0, rect.origin != .zero else { return nil }
  return rect
}

/** Programs whose page Accessibility was asked to describe (Electron's AXManualAccessibility), once each. */
var woken = Set<Int32>()

/**
 * The text cursor of the program `pid` as {x, y, h} (its top left, its height), or {} when it shows none:
 * the focused field's selection, drawn by AXBoundsForRange (the character before it when an empty range has no box),
 * else a one-line field's own frame. An Electron app describes its page only once asked (AXManualAccessibility,
 * which costs it little); AXEnhancedUserInterface, which Chrome would want, is not set: it upsets window managers.
 */
func caretOf(_ pid: Int32) -> [String: Any] {
  guard pid > 0 else { return [:] }
  let app = AXUIElementCreateApplication(pid)
  // A program that does not answer is not waited for long (the default is 6 s).
  AXUIElementSetMessagingTimeout(app, 0.05)
  let focused = ax(app, kAXFocusedUIElementAttribute)
  guard let focused, CFGetTypeID(focused) == AXUIElementGetTypeID() else {
    if woken.insert(pid).inserted { AXUIElementSetAttributeValue(app, "AXManualAccessibility" as CFString, kCFBooleanTrue) }
    return [:]
  }
  let element = focused as! AXUIElement
  var rect: CGRect?
  var range = CFRange()
  if let value = axRect(ax(element, kAXSelectedTextRangeAttribute), .cfRange), AXValueGetValue(value, .cfRange, &range) {
    rect = boundsOf(element, range.location, 0)
    if rect == nil, range.location > 0, let before = boundsOf(element, range.location - 1, 1) {
      rect = CGRect(x: before.maxX, y: before.minY, width: 0, height: before.height)
    }
  } else if woken.insert(pid).inserted {
    AXUIElementSetAttributeValue(app, "AXManualAccessibility" as CFString, kCFBooleanTrue)
  }
  if rect == nil, let p = axRect(ax(element, kAXPositionAttribute), .cgPoint), let s = axRect(ax(element, kAXSizeAttribute), .cgSize) {
    var point = CGPoint.zero
    var size = CGSize.zero
    // ponytail: a field of one line only; a page's frame would put the badge at its far bottom, the pointer is nearer.
    if AXValueGetValue(p, .cgPoint, &point), AXValueGetValue(s, .cgSize, &size), size.height > 0, size.height < 80 { rect = CGRect(origin: point, size: size) }
  }
  guard let rect else { return [:] }
  return ["x": Int(rect.minX.rounded()), "y": Int(rect.minY.rounded()), "h": max(1, Int(rect.height.rounded()))]
}

/**
 * Whether the program `pid` has a selection, for the bar by a selection: {ok, secret, x, y, h} with x the left edge of
 * its first character and y…y+h that character's line (points, as `caretOf`); ok false when it shows none by Accessibility.
 * Only whether there is text is told: the text itself never leaves this function.
 */
func selectionOf(_ pid: Int32) -> [String: Any] {
  guard pid > 0 else { return ["ok": false] }
  let app = AXUIElementCreateApplication(pid)
  AXUIElementSetMessagingTimeout(app, 0.05)
  guard let focused = ax(app, kAXFocusedUIElementAttribute), CFGetTypeID(focused) == AXUIElementGetTypeID() else {
    if woken.insert(pid).inserted { AXUIElementSetAttributeValue(app, "AXManualAccessibility" as CFString, kCFBooleanTrue) }
    return ["ok": false]
  }
  let element = focused as! AXUIElement
  if IsSecureEventInputEnabled() || (ax(element, kAXSubroleAttribute) as? String) == "AXSecureTextField" { return ["ok": false, "secret": true] }
  var range = CFRange()
  let ranged = axRect(ax(element, kAXSelectedTextRangeAttribute), .cfRange).map { AXValueGetValue($0, .cfRange, &range) } ?? false
  let text = (ax(element, kAXSelectedTextAttribute) as? String)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
  guard !text.isEmpty || (ranged && range.length > 0) else { return ["ok": false] }
  var o: [String: Any] = ["ok": true]
  guard ranged, range.length > 0 else { return o }
  // The first character; a line break first has no box of its own, the whole range's top left stands for it.
  guard let start = boundsOf(element, range.location, 1) ?? boundsOf(element, range.location, range.length) else { return o }
  o["x"] = Int(start.minX.rounded())
  o["y"] = Int(start.minY.rounded())
  o["h"] = max(1, Int(min(start.height, 400).rounded()))
  return o
}

/** Accessibility and the window list can keep a caller waiting: asked off the tap's thread, one at a time. */
let axQueue = DispatchQueue(label: "caret")

/** Caps Lock turned over, as the Caps Lock key would (a posted Caps Lock key does not turn it on a Mac). */
func toggleCaps() {
  let service = IOServiceGetMatchingService(kIOMainPortDefault, IOServiceMatching(kIOHIDSystemClass))
  defer { IOObjectRelease(service) }
  var connect: io_connect_t = 0
  guard IOServiceOpen(service, mach_task_self_, UInt32(kIOHIDParamConnectType), &connect) == KERN_SUCCESS else { return }
  defer { IOServiceClose(connect) }
  var on = false
  IOHIDGetModifierLockState(connect, Int32(kIOHIDCapsLockState), &on)
  IOHIDSetModifierLockState(connect, Int32(kIOHIDCapsLockState), !on)
}

/** Whether a window of the program `pid` covers a whole screen (a full-screen game, video, a program in its own full-screen space). */
func fillsScreen(_ pid: Int32) -> Bool {
  guard pid > 0, let list = CGWindowListCopyWindowInfo([.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID) as? [[String: Any]] else { return false }
  var ids = [CGDirectDisplayID](repeating: 0, count: 16)
  var count: UInt32 = 0
  CGGetActiveDisplayList(16, &ids, &count)
  let screens = ids.prefix(Int(count)).map { CGDisplayBounds($0) }
  return list.contains { w in
    guard (w[kCGWindowOwnerPID as String] as? Int32) == pid, (w[kCGWindowLayer as String] as? Int) == 0,
      let b = w[kCGWindowBounds as String] as? NSDictionary, let r = CGRect(dictionaryRepresentation: b) else { return false }
    return screens.contains(r)
  }
}

switch CommandLine.arguments.dropFirst().first {
case "layouts":
  print(String(data: try! JSONSerialization.data(withJSONObject: layouts()), encoding: .utf8)!)
  exit(0)
case "sel":
  let pid = NSWorkspace.shared.frontmostApplication?.processIdentifier ?? 0
  let started = Date()
  var sel = selectionOf(pid)
  if (sel["ok"] as? Bool) != true, sel["secret"] == nil { sel = selectionOf(pid) }
  sel["app"] = NSWorkspace.shared.frontmostApplication?.localizedName ?? ""
  sel["ms"] = Int(Date().timeIntervalSince(started) * 1000)
  print(String(data: try! JSONSerialization.data(withJSONObject: sel), encoding: .utf8)!)
  exit(0)
case "caret":
  let pid = NSWorkspace.shared.frontmostApplication?.processIdentifier ?? 0
  let started = Date()
  var caret = caretOf(pid)
  // An Electron app just asked to describe its page answers the second time.
  if caret.isEmpty { caret = caretOf(pid) }
  caret["app"] = NSWorkspace.shared.frontmostApplication?.localizedName ?? ""
  caret["ms"] = Int(Date().timeIntervalSince(started) * 1000)
  caret["full"] = fillsScreen(pid)
  print(String(data: try! JSONSerialization.data(withJSONObject: caret), encoding: .utf8)!)
  exit(0)
default: break
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
    } else if key["caps"] != nil {
      toggleCaps()
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
    if command == "bar" {
      // The bar's window (points): its clicks are kept from every window, so the program in front stays key; Node is told them as usual.
      barLock.lock()
      if let r = c["rect"] as? [String: Any], let x = r["x"] as? Double, let y = r["y"] as? Double, let w = r["width"] as? Double, let h = r["height"] as? Double {
        barRect = CGRect(x: x, y: y, width: w, height: h)
      } else {
        barRect = nil
      }
      barLock.unlock()
      continue
    }
    if command == "sel" {
      let n = c["n"] as? Int ?? 0
      let pid = Int32(c["pid"] as? Int ?? 0)
      axQueue.async {
        var o = selectionOf(pid)
        o["e"] = "sel"
        o["n"] = n
        emit(o)
      }
      continue
    }
    if command == "caret" {
      let n = c["n"] as? Int ?? 0
      let pid = Int32(c["pid"] as? Int ?? 0)
      axQueue.async {
        var o = caretOf(pid)
        o["e"] = "caret"
        o["n"] = n
        emit(o)
      }
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

/** The bar by a selection, while shown: a click on it goes to Node alone, never to a window (a click on any window takes the keyboard from the program). */
let barLock = NSLock()
var barRect: CGRect?
var barDown = false

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
    if type == .leftMouseDown {
      barLock.lock()
      barDown = barRect?.contains(p) ?? false
      barLock.unlock()
      return barDown
    }
    if type == .leftMouseUp && barDown {
      barDown = false
      return true
    }
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
var full = false
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
  // Off the tap's thread: the window list's first asking takes about 100 ms.
  let (pid, name) = front
  axQueue.async {
    let fills = fillsScreen(pid)
    if fills != full {
      full = fills
      emit(["e": "full", "on": fills, "name": name])
    }
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
