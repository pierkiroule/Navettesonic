# Soono (Navettesonic)

An interactive web-based "sonic odyssey" experience where users control a fish-feather character in an underwater environment to interact with sound bubbles.

## Architecture

- **Type**: Pure static HTML/CSS/JavaScript site — no build system or package manager
- **Main file**: `index.html` — contains all HTML, CSS, and JavaScript
- **Assets**: `logo.png`, `video/soono.mp4`, `video/soono2.mp4`, `video/soono3.mp4`

## Technologies

- HTML5 Canvas API for interactive animations
- Web Audio API for real-time spatial sound synthesis
- Tailwind CSS via CDN for styling
- No backend, no build step

## Running

The app is served via Python's built-in HTTP server:

```
python3 -m http.server 5000 --bind 0.0.0.0
```

Workflow: `Start application` on port 5000 (webview)

## Deployment

Configured as a **static** deployment with `publicDir: "."`.
