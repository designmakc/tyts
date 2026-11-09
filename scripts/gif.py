"""docs/frames/*.png (scripts/demo.ps1) -> docs/demo.gif, 8 fps, the last frame held."""

from pathlib import Path

from PIL import Image

root = Path(__file__).resolve().parent.parent
frames = sorted((root / 'docs' / 'frames').glob('*.png'))
if not frames:
    raise SystemExit('no frames: run scripts/demo.ps1 first')

images = [Image.open(f).convert('RGB').quantize(colors=128, method=Image.Quantize.MEDIANCUT) for f in frames]
durations = [125] * len(images)
durations[-1] = 2500
out = root / 'docs' / 'demo.gif'
images[0].save(out, save_all=True, append_images=images[1:], duration=durations, loop=0, optimize=True)
print(f'{out}: {len(images)} frames, {out.stat().st_size // 1024} KB')
