// speakers-mac --models <dir> [--speakers <n>] <input.wav>
//
// Finds who spoke when in a 16 kHz mono WAV with FluidAudio's offline diarizer, one speaker
// at a time (the CLI's offline mode with --exclusive-segments, its defaults otherwise).
// <dir> holds the models as they are on Hugging Face (FluidInference/speaker-diarization-coreml):
// Segmentation.mlmodelc, FBank.mlmodelc, Embedding.mlmodelc, PldaRho.mlmodelc, plda-parameters.json.
// Nothing is downloaded: the models are loaded here from <dir> by hand, never through
// FluidAudio's ModelHub (which fetches whatever is missing), and its offline mode is on besides.
//
// stderr: "progress <done> <total>" lines; "missing models: <names>" and exit 3; any other
// error as one line and exit 1.
// stdout: {"turns": [[start, end, "S1"], ...], "speakers": <count>}, seconds to 0.01, in time order.
@preconcurrency import CoreML
import FluidAudio
import Foundation

func say(_ line: String) {
    FileHandle.standardError.write(Data((line + "\n").utf8))
}

func fail(_ message: String, _ code: Int32 = 1) -> Never {
    say(message.replacingOccurrences(of: "\n", with: " "))
    exit(code)
}

// Arguments
var modelsPath: String?
var speakers: Int?
var input: String?
var args = CommandLine.arguments.dropFirst()
while let arg = args.popFirst() {
    switch arg {
    case "--models":
        modelsPath = args.popFirst()
    case "--speakers":
        guard let value = args.popFirst().flatMap({ Int($0) }), value > 0 else {
            fail("--speakers needs a whole number above 0")
        }
        speakers = value
    default:
        if input != nil || arg.hasPrefix("--") { fail("unknown argument: \(arg)") }
        input = arg
    }
}
guard let modelsPath, let input else {
    fail("usage: speakers-mac --models <dir> [--speakers <n>] <input.wav>")
}
let models = URL(fileURLWithPath: modelsPath, isDirectory: true)

// Every file the diarizer needs, checked before anything loads. A compiled model counts
// only with its coremldata.bin (a half-copied folder does not).
let names = ModelNames.OfflineDiarizer.self
let required = [names.segmentationFile, names.fbankFile, names.embeddingFile, names.pldaRhoFile, names.pldaParameters]
let missing = required.filter { name in
    let path = models.appendingPathComponent(name)
    let probe = name.hasSuffix(".mlmodelc") ? path.appendingPathComponent("coremldata.bin") : path
    return !FileManager.default.fileExists(atPath: probe.path)
}
if !missing.isEmpty { fail("missing models: \(missing.joined(separator: ", "))", 3) }

ModelHub.offlineMode = true

func loadModel(_ name: String, _ units: MLComputeUnits) throws -> MLModel {
    // The settings OfflineDiarizerModels.load uses.
    let config = MLModelConfigurationUtils.defaultConfiguration(computeUnits: units)
    return try MLModel(contentsOf: models.appendingPathComponent(name), configuration: config)
}

// plda-parameters.json: tensors.psi.data_base64, little-endian float32 (as OfflineDiarizerModels reads it).
func loadPsi() throws -> [Double] {
    let data = try Data(contentsOf: models.appendingPathComponent(names.pldaParameters))
    guard
        let root = try JSONSerialization.jsonObject(with: data) as? [String: Any],
        let tensors = root["tensors"] as? [String: Any],
        let psi = tensors["psi"] as? [String: Any],
        let base64 = psi["data_base64"] as? String,
        let bytes = Data(base64Encoded: base64, options: [.ignoreUnknownCharacters]),
        bytes.count >= MemoryLayout<Float>.size
    else { throw NSError(domain: "speakers-mac", code: 1, userInfo: [NSLocalizedDescriptionKey: "plda-parameters.json has no psi tensor"]) }
    var floats = [Float](repeating: 0, count: bytes.count / MemoryLayout<Float>.size)
    _ = floats.withUnsafeMutableBytes { bytes.copyBytes(to: $0) }
    return floats.map { Double($0) }
}

func label(_ text: String) -> String {
    let data = try! JSONSerialization.data(withJSONObject: text, options: [.fragmentsAllowed])
    return String(decoding: data, as: UTF8.self)
}

do {
    let started = Date()
    // The CLI's offline defaults (ProcessCommand.ParsedArgs), exclusive segments on.
    var config = OfflineDiarizerConfig(
        clusteringThreshold: 0.6,
        Fa: 0.07,
        Fb: 0.8,
        windowDuration: 10.0,
        sampleRate: 16_000,
        segmentationStepRatio: 0.2,
        embeddingBatchSize: 32,
        embeddingExcludeOverlap: true,
        embeddingSkipStrategy: .none,
        minSegmentDuration: 1.0,
        minGapDuration: 0.1,
        exclusiveSegments: true,
        speechOnsetThreshold: 0.5,
        speechOffsetThreshold: 0.5,
        segmentationMinDurationOn: 0.0,
        segmentationMinDurationOff: 0.0,
        maxVBxIterations: 20,
        convergenceTolerance: 1e-4,
        embeddingExportPath: nil
    )
    if let speakers { config = config.withSpeakers(exactly: speakers) }

    let loaded = OfflineDiarizerModels(
        segmentationModel: try loadModel(names.segmentationFile, .all),
        fbankModel: try loadModel(names.fbankFile, .cpuOnly),  // faster on the processor, as in load()
        embeddingModel: try loadModel(names.embeddingFile, .all),
        pldaRhoModel: try loadModel(names.pldaRhoFile, .all),
        pldaPsi: try loadPsi(),
        compilationDuration: Date().timeIntervalSince(started)
    )
    let manager = OfflineDiarizerManager(config: config)
    manager.initialize(models: loaded)

    let result = try await manager.process(URL(fileURLWithPath: input)) { done, total in
        say("progress \(done) \(total)")
    }
    let segments = result.segments.sorted {
        ($0.startTimeSeconds, $0.endTimeSeconds) < ($1.startTimeSeconds, $1.endTimeSeconds)
    }
    let turns = segments.map {
        String(format: "[%.2f, %.2f, ", $0.startTimeSeconds, $0.endTimeSeconds) + label($0.speakerId) + "]"
    }
    let count = Set(segments.map(\.speakerId)).count
    print("{\"turns\": [\(turns.joined(separator: ", "))], \"speakers\": \(count)}")
} catch {
    fail("diarization failed: \(error.localizedDescription)")
}
