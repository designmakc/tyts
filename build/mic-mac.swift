// Kryakl's look at the microphone on a Mac, for a call recording that starts by
// itself (src/micwatch.ts, src/callwatch.ts). Every 2 s one JSON line:
// {"inUse": the default input device runs somewhere, "apps": the programs taking
// input now (macOS 14.4+, else null), each its app's pid, executable name, bundle
// id and its windows' titles (only with Screen Recording; none without)}.
// A helper process (Chrome's, Slack's) is told as the app it belongs to.
// npm run dist:mac builds it into vendor/mic-mac.

import AppKit
import CoreAudio
import CoreGraphics

func prop<T: FixedWidthInteger>(_ object: AudioObjectID, _ selector: AudioObjectPropertySelector, _ initial: T) -> T? {
  var address = AudioObjectPropertyAddress(mSelector: selector, mScope: kAudioObjectPropertyScopeGlobal, mElement: kAudioObjectPropertyElementMain)
  var value = initial
  var size = UInt32(MemoryLayout<T>.size)
  return AudioObjectGetPropertyData(object, &address, 0, nil, &size, &value) == noErr ? value : nil
}

func inputInUse() -> Bool {
  guard let device: AudioDeviceID = prop(AudioObjectID(kAudioObjectSystemObject), kAudioHardwarePropertyDefaultInputDevice, AudioDeviceID(0)), device != 0 else { return false }
  return (prop(device, kAudioDevicePropertyDeviceIsRunningSomewhere, UInt32(0)) ?? 0) != 0
}

/** The app a process belongs to: itself when it is one, else the running app whose bundle id begins its own ("com.google.Chrome.helper" → Chrome). */
func owner(pid: pid_t, bundle: String) -> NSRunningApplication? {
  let own = NSRunningApplication(processIdentifier: pid)
  if let own, own.activationPolicy == .regular { return own }
  let apps = NSWorkspace.shared.runningApplications.filter { app in
    guard let id = app.bundleIdentifier, !id.isEmpty else { return false }
    return bundle == id || bundle.hasPrefix(id + ".")
  }
  return apps.max { ($0.bundleIdentifier ?? "").count < ($1.bundleIdentifier ?? "").count } ?? own
}

func titles(of pid: pid_t) -> [String] {
  guard let list = CGWindowListCopyWindowInfo([.optionAll, .excludeDesktopElements], kCGNullWindowID) as? [[String: Any]] else { return [] }
  return list.compactMap { w in
    guard (w[kCGWindowOwnerPID as String] as? Int32) == pid, (w[kCGWindowLayer as String] as? Int) == 0,
          let name = w[kCGWindowName as String] as? String, !name.isEmpty else { return nil }
    return name
  }
}

func inputApps() -> [[String: Any]]? {
  guard #available(macOS 14.4, *) else { return nil }
  var address = AudioObjectPropertyAddress(mSelector: kAudioHardwarePropertyProcessObjectList, mScope: kAudioObjectPropertyScopeGlobal, mElement: kAudioObjectPropertyElementMain)
  var size: UInt32 = 0
  let system = AudioObjectID(kAudioObjectSystemObject)
  guard AudioObjectGetPropertyDataSize(system, &address, 0, nil, &size) == noErr else { return [] }
  var objects = [AudioObjectID](repeating: 0, count: Int(size) / MemoryLayout<AudioObjectID>.size)
  guard AudioObjectGetPropertyData(system, &address, 0, nil, &size, &objects) == noErr else { return [] }
  var seen = Set<pid_t>()
  var out: [[String: Any]] = []
  for object in objects {
    guard (prop(object, kAudioProcessPropertyIsRunningInput, UInt32(0)) ?? 0) != 0,
          let pid: pid_t = prop(object, kAudioProcessPropertyPID, pid_t(-1)), pid > 0 else { continue }
    var bundle = ""
    var bundleAddress = AudioObjectPropertyAddress(mSelector: kAudioProcessPropertyBundleID, mScope: kAudioObjectPropertyScopeGlobal, mElement: kAudioObjectPropertyElementMain)
    var ref: Unmanaged<CFString>?
    var refSize = UInt32(MemoryLayout<Unmanaged<CFString>?>.size)
    if AudioObjectGetPropertyData(object, &bundleAddress, 0, nil, &refSize, &ref) == noErr, let ref { bundle = ref.takeRetainedValue() as String }
    let app = owner(pid: pid, bundle: bundle)
    let appPid = app?.processIdentifier ?? pid
    if !seen.insert(appPid).inserted { continue }
    let name = app?.executableURL?.lastPathComponent ?? app?.localizedName ?? bundle
    out.append(["pid": Int(appPid), "name": name, "bundle": app?.bundleIdentifier ?? bundle, "titles": titles(of: appPid)])
  }
  return out
}

setvbuf(stdout, nil, _IOLBF, 0)
while true {
  let report: [String: Any] = ["inUse": inputInUse(), "apps": inputApps() as Any? ?? NSNull(), "named": CGPreflightScreenCaptureAccess()]
  if let data = try? JSONSerialization.data(withJSONObject: report), let line = String(data: data, encoding: .utf8) { print(line) }
  Thread.sleep(forTimeInterval: 2)
}
