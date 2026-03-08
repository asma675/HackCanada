# Savoura

Savoura is a Canadian-focused sustainable meal planning app rebuilt **without Base44**. This version keeps the existing React/Vite UI and replaces the backend with a custom Node/Express API plus Gemini integration.

## Stack
- React 18 + Vite
- Tailwind CSS + shadcn/ui
- TanStack Query
- Framer Motion
- Express backend
- Gemini API for AI meal planning, recipe vetting, grocery grouping, and personalization
- Google Maps / Places for the local food map
- JSON file persistence for local development

## What changed
- Removed Base44 runtime dependency from the app flow
- Added a custom backend under `server/`
- Added a frontend compatibility client in `src/api/base44Client.js`
- Added Gemini-powered `/api/llm/invoke`
- Added backend function endpoints for:
  - `getMapKey`
  - `mapsProxy`
  - `vetRecipe`
- Added local sign-in flow for development

## Environment variables
Create a `.env` file from `.env.example` and set:

```bash
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.0-flash
GOOGLE_MAPS_API_KEY=your_server_side_maps_key
GOOGLE_MAPS_BROWSER_KEY=your_browser_maps_key
PORT=3001
VITE_API_BASE_URL=http://localhost:3001/api
```

## Run locally
```bash
npm install
npm run server
npm run dev
```

Or run both together:
```bash
npm run dev:full
```

## Notes
- Data is stored in `server/data.json` for local development.
- Authentication is lightweight local email-based sign-in for development use.
- Google Maps features require valid Maps and Places API keys.
- Gemini-backed features require a valid Gemini API key.
