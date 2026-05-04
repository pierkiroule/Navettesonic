from pathlib import Path

p = Path("src/components/SoonCanvas.jsx")
s = p.read_text()

# Ajoute les props si absentes
if "  viewZoom = 1," not in s:
    s = s.replace(
        "  eyesClosed,\n",
        "  eyesClosed,\n  viewZoom = 1,\n  visualLight = true,\n  depth = 1,\n"
    )

# Ajoute dans stateRef initial si absent
if "      viewZoom,\n" not in s:
    s = s.replace(
        "      eyesClosed,\n",
        "      eyesClosed,\n      viewZoom,\n      visualLight,\n      depth,\n"
    )

# Ajoute dans stateRef.current si absent
if "      viewZoom,\n      visualLight,\n      depth,\n" not in s:
    s = s.replace(
        "      eyesClosed,\n",
        "      eyesClosed,\n      viewZoom,\n      visualLight,\n      depth,\n"
    )

# Ajoute dans les dépendances si pattern présent
s = s.replace(
    "[mode, bubbles, fish, selectedBubbleId, path, eyesClosed]",
    "[mode, bubbles, fish, selectedBubbleId, path, eyesClosed, viewZoom, visualLight, depth]"
)

p.write_text(s)
print("OK: SoonCanvas reçoit viewZoom / visualLight / depth")
