# Task Manager

A kanban-style **Task Manager** built with **React + Vite** and deployed on **Vercel**.

## 🔗 Live Demo

**https://taskmanager-invinsiblesri.vercel.app**

Open the link and start adding tasks - it works immediately, with no backend or sign-in required.

## Features

- Kanban board with **Pending**, **Ongoing** and **Completed** columns
- Add a task with a chosen starting status
- Move tasks between columns: Start, Back, Complete, Reopen
- Delete a task, or clear every completed task at once
- Live search across task titles
- Completion progress bar with counts per column
- Toast notifications instead of browser alerts
- Tasks saved in `localStorage`, so they survive a refresh
- Fully responsive: three columns on desktop, stacked on mobile

## Tech Stack

| Layer | Used |
| --- | --- |
| UI | React 19 |
| Build tool | Vite 8 |
| HTTP client | Axios (only when a backend URL is configured) |
| Hosting | Vercel (static build from `dist/`) |

## Project Structure

```
FSWD-EX-4-TASKMANAGER/
├── index.html          # Vite HTML entry point
├── vercel.json         # Vercel build + SPA rewrite config
├── vite.config.mjs     # Vite + React plugin
├── server.js           # Optional Express + MongoDB tasks API
├── public/             # favicon, logos, manifest, robots.txt
└── src/
    ├── main.jsx        # React bootstrap
    ├── App.jsx         # Board, task actions and persistence
    ├── App.css         # Component styles
    └── index.css       # Base reset
```

## How It Works On Vercel

`vercel.json` pins the deployment:

- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Rewrite:** `/(.*)` → `/index.html` (single page app)

Task storage is decided at build time:

1. **No `VITE_API_URL`** (current Vercel setup) - tasks live in the browser's `localStorage`, so the page is fully functional on its own.
2. **`VITE_API_URL` set** - the board loads `GET /tasks` and syncs adds, status changes and deletes to the Express API in `server.js`.

Copy `.env.example` to `.env.local` and set `VITE_API_URL` to use the backend.

## Local Development

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build in dist/
```

Optional tasks API (requires MongoDB):

```bash
npm run start:api   # node server.js -> http://localhost:5000
```

## Deployments

Every push to `main` triggers an automatic production deployment on Vercel.

- Production: https://taskmanager-invinsiblesri.vercel.app
- Vercel project: `taskmanager`
