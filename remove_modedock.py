from pathlib import Path

p = Path("src/pages/SoonApp.jsx")
s = p.read_text()

s = s.replace("<ModeDock onIntro={onBack} />", "")

p.write_text(s)
print("OK: ModeDock supprimé du bas")
