from pathlib import Path

p = Path("src/pages/SoonApp.jsx")
s = p.read_text()

if 'import Profile from "./Profile.jsx";' not in s:
    s = s.replace(
        'import SoonCanvas from "../components/SoonCanvas.jsx";',
        'import SoonCanvas from "../components/SoonCanvas.jsx";\nimport Profile from "./Profile.jsx";'
    )

if 'const [page, setPage] = useState("arena");' not in s:
    s = s.replace(
        'const [viewZoom, setViewZoom] = useState(1);',
        'const [page, setPage] = useState("arena");\n  const [viewZoom, setViewZoom] = useState(1);'
    )

if 'if (page === "profile")' not in s:
    s = s.replace(
        'return (\n    <main className="soon-app">',
        'if (page === "profile") {\n    return <Profile onBack={() => setPage("arena")} />;\n  }\n\n  return (\n    <main className="soon-app">'
    )

s = s.replace(
    '<button onClick={() => setPage && setPage("profile")}>',
    '<button onClick={() => setPage("profile")}>'
)

p.write_text(s)
print("OK: Profil branché dans SoonApp")
