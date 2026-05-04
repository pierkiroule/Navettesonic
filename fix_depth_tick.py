from pathlib import Path

p = Path("src/pages/SoonApp.jsx")
s = p.read_text()

s = s.replace(
    "onTickFish={() => tickFish({ swimSpeed })}",
    "onTickFish={() => tickFish({ swimSpeed, depth })}"
)

p.write_text(s)
print("OK: depth envoyée au store")
