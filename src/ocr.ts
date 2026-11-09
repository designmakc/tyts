// Reads the text of a snipped piece of the screen with the OCR engines built
// into Windows (Windows.Media.Ocr), through Windows PowerShell like the
// system voice in speech.ts. Every engine of the languages asked that is
// installed reads the picture (the person's own first, English last), and
// ocrpick.ts takes each line from the one that reads it best. Small text is
// scaled up first, as the engines misread it.

import { execFile, spawn } from 'node:child_process'

import type { OcrReading } from './ocrpick'
import type { OcrLine } from './ocrtext'
import { POWERSHELL } from './system32'

const SCRIPT = `
[Console]::OutputEncoding = [Text.Encoding]::UTF8
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
$null = [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType = WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapTransform, Windows.Graphics.Imaging, ContentType = WindowsRuntime]
$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation\`1' })[0]
function Await($op, [Type]$type) { $t = $asTask.MakeGenericMethod($type).Invoke($null, @($op)); $t.Wait(); $t.Result }
function Recognize($engine, $bitmap) { Await ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult]) }
$available = @([Windows.Media.Ocr.OcrEngine]::AvailableRecognizerLanguages)
$engines = @()
foreach ($want in $env:TUTOR_OCR_LANGS.Split(',')) {
  $match = $available | Where-Object { $_.LanguageTag -eq $want -or $_.LanguageTag.Split('-')[0] -eq $want } | Select-Object -First 1
  if ($match -and -not ($engines | Where-Object { $_.tag -eq $match.LanguageTag })) {
    $engines += @{ tag = $match.LanguageTag; engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($match) }
  }
}
if ($engines.Count -eq 0) { @{ readings = @() } | ConvertTo-Json -Compress; exit }
$file = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($env:TUTOR_OCR_IMAGE)) ([Windows.Storage.StorageFile])
$stream = Await ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
$decoder = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
$bitmap = Await ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
$first = Recognize $engines[0].engine $bitmap
# Lines of small text are read again scaled up twice (three times made "place" "р1асе").
$heights = @(foreach ($line in $first.Lines) { ($line.Words | ForEach-Object { $_.BoundingRect.Height } | Measure-Object -Maximum).Maximum }) | Sort-Object
$scale = 1
if ($heights.Count -gt 0) {
  $usual = $heights[[int][Math]::Floor($heights.Count / 2)]
  $room = [Math]::Floor([Windows.Media.Ocr.OcrEngine]::MaxImageDimension / [Math]::Max($decoder.PixelWidth, $decoder.PixelHeight))
  $scale = if ($usual -lt 20) { [Math]::Min(2, $room) } else { 1 }
  if ($scale -lt 2) { $scale = 1 }
}
if ($scale -gt 1) {
  $transform = New-Object Windows.Graphics.Imaging.BitmapTransform
  $transform.ScaledWidth = [uint32]($decoder.PixelWidth * $scale)
  $transform.ScaledHeight = [uint32]($decoder.PixelHeight * $scale)
  $transform.InterpolationMode = [Windows.Graphics.Imaging.BitmapInterpolationMode]::Fant
  $bitmap = Await ($decoder.GetSoftwareBitmapAsync([Windows.Graphics.Imaging.BitmapPixelFormat]::Bgra8, [Windows.Graphics.Imaging.BitmapAlphaMode]::Premultiplied, $transform, [Windows.Graphics.Imaging.ExifOrientationMode]::IgnoreExifOrientation, [Windows.Graphics.Imaging.ColorManagementMode]::DoNotColorManage)) ([Windows.Graphics.Imaging.SoftwareBitmap])
}
$readings = @(for ($i = 0; $i -lt $engines.Count; $i++) {
  $result = if ($i -eq 0 -and $scale -eq 1) { $first } else { Recognize $engines[$i].engine $bitmap }
  $lines = @(foreach ($line in $result.Lines) {
    $boxes = @($line.Words | ForEach-Object { $_.BoundingRect })
    $left = ($boxes | ForEach-Object { $_.X } | Measure-Object -Minimum).Minimum
    $top = ($boxes | ForEach-Object { $_.Y } | Measure-Object -Minimum).Minimum
    $right = ($boxes | ForEach-Object { $_.X + $_.Width } | Measure-Object -Maximum).Maximum
    $bottom = ($boxes | ForEach-Object { $_.Y + $_.Height } | Measure-Object -Maximum).Maximum
    @{ text = $line.Text; x = $left / $scale; y = $top / $scale; w = ($right - $left) / $scale; h = ($bottom - $top) / $scale }
  })
  @{ lang = $engines[$i].tag; lines = $lines }
})
$stream.Dispose()
@{ readings = $readings; scale = $scale } | ConvertTo-Json -Depth 5 -Compress
`

export type OcrResult = {
  /** One reading per engine, in the order of the languages asked; empty when Windows has text recognition for none of them. */
  readings: OcrReading[]
  /** How much the picture was scaled up before it was read. */
  scale: number
}

function linesOf(raw: unknown): OcrLine[] {
  return (Array.isArray(raw) ? raw : []).filter((l): l is OcrLine => typeof l?.text === 'string')
}

/** Reads the PNG at `image` with every engine installed among `languages` (codes such as "ru", "en"). */
export function recognize(image: string, languages: readonly string[]): Promise<OcrResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(POWERSHELL, ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(SCRIPT, 'utf16le').toString('base64')], {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      env: { ...process.env, TUTOR_OCR_IMAGE: image, TUTOR_OCR_LANGS: languages.join(',') },
    })
    let out = ''
    let err = ''
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => (out += chunk))
    child.stderr.on('data', (chunk: string) => (err = (err + chunk).slice(-2000)))
    const timer = setTimeout(() => child.kill(), 30_000)
    child.on('error', error => {
      clearTimeout(timer)
      reject(error)
    })
    child.on('exit', code => {
      clearTimeout(timer)
      try {
        const parsed = JSON.parse(out.trim()) as { readings?: unknown; scale?: unknown }
        // ConvertTo-Json writes an array of one as the object itself.
        const raw = Array.isArray(parsed.readings) ? parsed.readings : parsed.readings ? [parsed.readings] : []
        const readings = raw
          .filter((r): r is { lang: string; lines: unknown } => typeof r?.lang === 'string')
          .map(r => ({ lang: r.lang, lines: linesOf(Array.isArray(r.lines) ? r.lines : r.lines ? [r.lines] : []) }))
        resolve({ readings, scale: typeof parsed.scale === 'number' ? parsed.scale : 1 })
      } catch {
        reject(new Error(err.trim().split('\n').pop() || `text recognition stopped (${code})`))
      }
    })
  })
}

/** The same on a Mac: `exe` (build/ocr.swift) reads the PNG at `image` with Vision, which finds the language itself; the reading is named `lang`. */
export function recognizeMac(exe: string, image: string, lang: string): Promise<OcrResult> {
  return new Promise((resolve, reject) => {
    execFile(exe, [image], { timeout: 60_000 }, (error, out) => {
      if (error) return reject(error)
      try {
        resolve({ readings: [{ lang, lines: linesOf(JSON.parse(out)) }], scale: 1 })
      } catch (e) {
        reject(e)
      }
    })
  })
}
