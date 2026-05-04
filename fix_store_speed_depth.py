from pathlib import Path

p = Path("src/store/useSoonStore.js")
s = p.read_text()

s = s.replace(
    "tickFish: ({ swimSpeed = 1 } = {}) => {",
    "tickFish: ({ swimSpeed = 1, depth = null } = {}) => {"
)

s = s.replace(
    "depth: fishDepth,",
    "depth: depth || fishDepth,"
)

p.write_text(s)
print("OK: swimSpeed/depth branchés dans store")
