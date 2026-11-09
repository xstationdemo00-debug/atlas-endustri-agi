"""Render build path independent from Node installation."""
from pathlib import Path
import shutil
root = Path(__file__).resolve().parents[1]
src = root / 'frontend'; out = root / 'dist'
required = ('index.html','assets/app.js','assets/styles.css')
for path in required:
    if not (src/path).is_file(): raise SystemExit(f'Missing: {path}')
if out.exists(): shutil.rmtree(out)
shutil.copytree(src,out)
print('PY_BUILD_OK:', len(list(out.rglob('*')))-1, 'files copied to dist')
