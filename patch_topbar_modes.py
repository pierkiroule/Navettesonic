from pathlib import Path

p = Path("src/pages/SoonApp.jsx")
s = p.read_text()

start = s.find("<header className=\"topbar\">")
end = s.find("</header>") + len("</header>")

new_topbar = """
<header className="topbar">
  <div className="topbar-inner">

    <button onClick={() => setViewZoom(v => Math.min(3.5, v + 0.2))}>＋</button>
    <button onClick={() => setViewZoom(v => Math.max(0.3, v - 0.2))}>－</button>
    <button onClick={() => setViewZoom(1)}>⟲</button>

    <button
      className={visualLight ? "" : "active"}
      onClick={() => setVisualLight(v => !v)}
    >
      ◐
    </button>

    <div className="mode-switch">
      <button onClick={() => setMode("intro")}>Intro</button>
      <button onClick={() => setMode("compo")}>Compo</button>
      <button onClick={() => setMode("reso")}>Odysséo</button>
    </div>

    <button onClick={onBack}>👤</button>

  </div>
</header>
"""

s = s[:start] + new_topbar + s[end:]

p.write_text(s)
print("OK: topbar avec modes")
