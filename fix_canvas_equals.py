from pathlib import Path
import re

p = Path("src/components/SoonCanvas.jsx")
s = p.read_text()

# Corrige les entrées invalides dans les objets stateRef
s = re.sub(r'(\s*)viewZoom\s*=\s*1,', r'\1viewZoom,', s)
s = re.sub(r'(\s*)visualLight\s*=\s*true,', r'\1visualLight,', s)
s = re.sub(r'(\s*)depth\s*=\s*1,', r'\1depth,', s)

# Supprime doublons éventuels consécutifs
s = re.sub(
    r'(\s*viewZoom,\s*\n\s*visualLight,\s*\n\s*depth,\s*)\n\s*viewZoom,\s*\n\s*visualLight,\s*\n\s*depth,',
    r'\1',
    s
)

p.write_text(s)
print("OK: viewZoom / visualLight / depth corrigés")
