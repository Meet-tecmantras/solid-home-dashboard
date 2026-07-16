# SolidJS Personal Home Dashboard

This is a single-page dashboard built with SolidJS that combines a live clock, weather lookup, persistent todo list, and motivational quotes in one polished layout. It is designed for personal use and runs entirely in the browser.

## Features

- **Clock**: Updates every second with the current local time and full date.
- **Weather lookup**: Search for any city (powered by Open-Meteo) and see temperature, conditions, and wind speed.
- **Todo list**: Add, complete, remove, and filter tasks with local persistence between sessions.
- **Motivational quote**: Fetches random quotes from the publicly accessible Type.fit API with a lightweight refresh control.
- **Theme toggle**: Switch between light and dark palettes for a comfortable experience.

## Getting Started

```bash
npm install
npm run dev
```

Then open the local dev server (typically `http://localhost:5173`) in your browser.

## Production Build

```bash
npm run build
```

## Notes

- All data (todos, theme) stays in the browser via `localStorage`.
- Weather and quotes are fetched on demand using public REST endpoints — no API key required.
