# NBA Stats - Frontend

React application for browsing NBA statistics.

## Tech Stack

- **React 19** with TypeScript
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router** - Navigation

## Development

```bash
npm install
npm run dev  # Port 5173
```

## Build

```bash
npm run build  # Output: dist/
npm run preview  # Preview production build
```

## Project Structure

```
src/
├── pages/          # Page components (Teams, Players, Games)
├── components/     # Reusable UI components (Cards, Lists)
├── context/        # React Context (NBA data)
├── services/       # API client
├── types/          # TypeScript definitions
└── lib/            # Utilities (cache, API provider)
```

## Environment Variables

- `VITE_API_URL` - API endpoint (set during Azure deployment)

## Code Quality

```bash
npm run lint       # ESLint
npm run type-check # TypeScript
```

## Deployment

Built and deployed to Azure Container Apps via `pipelines/build-frontend.yml`

**Production Server:** Nginx (see `nginx.conf`)

