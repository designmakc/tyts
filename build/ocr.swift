// Kryakl's text recognition on a Mac (Vision): the lines of the PNG named, as JSON
// in the picture's pixels, like Windows OCR's in src/ocr.ts. npm run dist:mac builds it into vendor/ocr-mac.

import Vision
import AppKit
let url = URL(fileURLWithPath: CommandLine.arguments[1])
let rep = NSBitmapImageRep(data: try! Data(contentsOf: url))!
let W = Double(rep.pixelsWide), H = Double(rep.pixelsHigh)
let req = VNRecognizeTextRequest()
req.recognitionLevel = .accurate
req.automaticallyDetectsLanguage = true
try! VNImageRequestHandler(url: url).perform([req])
var out: [[String: Any]] = []
for o in req.results ?? [] {
  guard let c = o.topCandidates(1).first else { continue }
  let b = o.boundingBox
  out.append(["text": c.string, "x": b.minX * W, "y": (1 - b.maxY) * H, "w": b.width * W, "h": b.height * H])
}
print(String(data: try! JSONSerialization.data(withJSONObject: out), encoding: .utf8)!)
