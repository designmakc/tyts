# Records the frames of docs/demo.gif: puts a text on the clipboard, starts
# 2Talker from source with --clipboard (the running copy opens the card),
# clicks a word, and captures the screen around the card every 125 ms.
# scripts/gif.py turns the frames into the GIF. The app must be running
# (npm start) with the natural voice downloaded; the pointer is parked at
# (300, 600), so leave the screen alone for the ten seconds it takes.
#
#   powershell -ExecutionPolicy Bypass -File scripts/demo.ps1
#   python scripts/gif.py

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms, System.Drawing
Add-Type -Namespace Demo -Name Mouse -MemberDefinition '[DllImport("user32.dll")] public static extern void mouse_event(int f, int x, int y, int d, int e);'

$root = Split-Path $PSScriptRoot -Parent
$frames = Join-Path $root 'docs\frames'
New-Item -ItemType Directory -Force $frames | Out-Null
Get-ChildItem $frames -Filter '*.png' | Remove-Item

$at = New-Object System.Drawing.Point 300, 600
# The card opens just under and right of the pointer; the frame holds it with room for the word card.
$region = New-Object System.Drawing.Rectangle ($at.X - 10), ($at.Y - 10), 500, 300
# "drifted" and the star of its word card, relative to the pointer, for the text below.
$word = New-Object System.Drawing.Point ($at.X + 290), ($at.Y + 74)
$star = New-Object System.Drawing.Point ($at.X + 427), ($at.Y + 107)

function Click($p) {
  [System.Windows.Forms.Cursor]::Position = $p
  Start-Sleep -Milliseconds 100
  [Demo.Mouse]::mouse_event(2, 0, 0, 0, 0)
  [Demo.Mouse]::mouse_event(4, 0, 0, 0, 0)
}

$n = 0
function Frame() {
  $bmp = New-Object System.Drawing.Bitmap $region.Width, $region.Height
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.CopyFromScreen($region.Location, [System.Drawing.Point]::Empty, $region.Size)
  $bmp.Save((Join-Path $frames ('{0:D3}.png' -f $script:n)))
  $g.Dispose(); $bmp.Dispose()
  $script:n++
}

Set-Clipboard -Value 'The morning was quiet. A small boat drifted along the river.'
[System.Windows.Forms.Cursor]::Position = $at
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
Start-Process -FilePath (Join-Path $root 'node_modules\electron\dist\electron.exe') -ArgumentList '.', '--clipboard' -WorkingDirectory $root

# The card opens and reads: ~4 s. Then a word is clicked and starred, the pointer parked away.
$steps = @(
  @{ at = 3600; do = { Click $word } },
  @{ at = 5600; do = { Click $star } },
  @{ at = 6000; do = { [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point ($at.X + 120), ($at.Y + 240) } }
)
$clock = [System.Diagnostics.Stopwatch]::StartNew()
$next = 0
while ($clock.ElapsedMilliseconds -lt 8500) {
  if ($next -lt $steps.Count -and $clock.ElapsedMilliseconds -ge $steps[$next].at) {
    & $steps[$next].do
    $next++
  }
  Frame
  Start-Sleep -Milliseconds 125
}
"$n frames in $frames"
