// swift-tools-version: 6.2
// Who spoke when on a Mac: FluidAudio's offline diarizer (CoreML, Neural Engine), built from
// source at a fixed commit. Only its Diarizer trait: no TTS, no NeMo text engine (whose
// prebuilt archive would otherwise be fetched at build time).
// npm run dist:mac builds it and copies the binary to vendor/speakers-mac.
import PackageDescription

let package = Package(
    name: "speakers-mac",
    platforms: [.macOS(.v14)],
    dependencies: [
        .package(
            url: "https://github.com/FluidInference/FluidAudio.git",
            revision: "e63b5230ee7d7428848ab17d76a57c6197836684",
            traits: ["Diarizer"]
        )
    ],
    targets: [
        .executableTarget(
            name: "speakers-mac",
            dependencies: [.product(name: "FluidAudio", package: "FluidAudio")]
        )
    ]
)
