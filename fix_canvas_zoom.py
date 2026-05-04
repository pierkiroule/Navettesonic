from pathlib import Path

p = Path("src/components/SoonCanvas.jsx")
s = p.read_text()

s = s.replace(
    "ctx.scale(camera.zoom, camera.zoom);",
    "ctx.scale(camera.zoom * (stateRef.current.viewZoom || 1), camera.zoom * (stateRef.current.viewZoom || 1));"
)

p.write_text(s)
print("OK: zoom cockpit branché")
