from pathlib import Path

p = Path("src/pages/SoonApp.jsx")
s = p.read_text()

start = s.find("<header")
end = s.find("</header>") + len("</header>")

new_header = """
<header className="top-nav">
  <div className="top-nav-inner">

    <button onClick={onBack}>
      Intro
    </button>

    <button onClick={() => setMode("compo")} className={mode==="compo"?"active":""}>
      Compo
    </button>

    <button onClick={() => setMode("reso")} className={mode==="reso"?"active":""}>
      Odysséo
    </button>

    <button onClick={() => setPage && setPage("profile")}>
      Perso
    </button>

  </div>
</header>
"""

p.write_text(s[:start] + new_header + s[end:])
print("OK: nav corrigée")
