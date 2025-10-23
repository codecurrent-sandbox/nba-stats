# NBA Stats Frontend Architecture

## Overview

The NBA Stats web client is built with React, TypeScript, and Vite. It consumes the NBA Stats API to display players, teams, and games. This document describes the structure, data flow, and configuration for the frontend.

```
frontend/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── context/
│   ├── lib/
│   ├── logging/
│   ├── pages/
│   ├── services/
│   └── types/
└── ARCHITECTURE.md
```

### Technology Stack
- React + React Router for UI and navigation
- TypeScript with strict compiler options
- Vite for development tooling and bundling
- Tailwind-compatible utility classes for styling

## Application Structure

### Routing & Layout
- Routing is configured in `src/main.tsx` using `react-router-dom`.
- `components/Layout.tsx` supplies the application shell (navigation + content region).
- Page components under `src/pages` render route-specific views:
	- `HomePage.tsx`
	- `PlayersPage.tsx`
	- `TeamsPage.tsx`
	- `GamesPage.tsx`
	- `PlayerDetailPage.tsx`

Pages compose reusable presentation components such as `PlayerList`, `TeamCard`, and `GameList` from `src/components`.

### State Management
`context/NBAProvider.tsx` implements a reducer-driven context storing collections, selections, statistics, and loading/error state. High-level actions (`setPlayers`, `setTeamStats`, etc.) wrap reducer dispatches so pages can update global state after API calls.

### Components
Components are typed, presentation-focused building blocks:
- **Cards** (`PlayerCard`, `TeamCard`, `GameCard`) summarize single entities.
- **Lists** (`PlayerList`, `TeamList`, `GameList`) handle filtering, skeleton/loading UI, and empty states.
- **Layout** (`Navigation`, `Layout`) provide global chrome and navigation.

## Typed API Client

`src/lib/apiClient.ts` owns all backend communication. It exposes strongly typed methods matching the API schema:
- `getPlayers`, `getPlayer`, `getPlayerStats`
- `getTeams`, `getTeam`, `getTeamStats`, `getTeamRoster`
- `getGames`, `getGame`
- `searchPlayers`, `searchTeams`
- `getHealth`

Key traits:
- Centralized `request` helper with timeout/abort handling.
- Normalizes `{ data: ... }` envelopes to plain payloads.
- Raises `ApiError` objects containing status and error codes.
- Emits structured diagnostics through `logging/logger.ts` (`trackApiCall`).

`src/services/nbaApi.ts` re-exports this client for backward compatibility; new code should import from `../lib/apiClient` directly.

## Types

Domain interfaces (`Player`, `Team`, `Game`, `PlayerStats`, `TeamStats`, `PaginatedResponse`, `ApiResponse`) reside in `src/types/nba.ts`. `PaginatedResponse` tolerates multiple pagination shapes (limit/offset/page/pageSize metadata).

## Logging

`src/logging/logger.ts` implements a configurable logger with optional remote delivery. Environment-specific presets live in `src/logging/config.ts`. The API client leverages this logger for tracing and error reporting.

## Environment Configuration

Environment variables are accessed via Vite (`import.meta.env`):
- `VITE_API_URL` – NBA Stats API base URL
- `VITE_LOG_ENDPOINT` – optional remote logging endpoint
- `VITE_APPINSIGHTS_CONNECTION_STRING`, `VITE_SENTRY_DSN` – telemetry integrations
- `VITE_APP_ENV` – environment label consumed by the logger config

Local overrides belong in `.env.development.local`, `.env.staging.local`, etc. Do not commit secrets.

## Data Flow

1. A page component issues a request through `apiClient` (typically in `useEffect`).
2. Responses update local state hooks and/or the shared `NBAContext`.
3. Presentational components receive typed props and render UI.
4. Errors are converted to friendly text via `getErrorMessage`; loading flags drive spinner UI in list components.

Example (`PlayersPage.tsx`):
- Calls `apiClient.getPlayers({ limit: 50 })` on mount.
- Updates `players`, `loading`, and `error` state with `useState`.
- Renders `PlayerList`, which applies search and position filters before display.

## Testing & Validation

- `npm run type-check` → TypeScript project references build (`tsc --noEmit`).
- `npm run lint` → ESLint rules (if configured in `package.json`).
- `npm run dev` → Vite dev server for manual validation.

Future iterations will introduce component and integration tests.

## Future Enhancements

- Introduce caching or React Query for declarative data fetching.
- Add richer charts/visualizations to detail pages when API data is available.
- Implement authentication and user-specific experiences.
- Expand automated testing coverage (unit, integration, E2E).
