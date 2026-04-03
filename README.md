# Copilot Issue Tracker

A cross-platform desktop application for browsing, managing, and merging GitHub Copilot session databases. Built with [Electrobun](https://blackboard.sh/electrobun), React, Tailwind CSS, and Vite.

---

## What it does

GitHub Copilot's CLI agent stores per-session SQLite databases under `~/.copilot/session-state/`. Each session tracks todos — tasks created during a Copilot coding session. Copilot Issue Tracker reads all of those databases, groups sessions by project, and gives you a unified place to view and manage everything.

**Key features:**

- **Projects view** — cards showing all discovered projects, their session count, and open todo count
- **Sessions view** — all sessions for a project sorted newest-first, with a per-session "Migrate" action to pull todos into the registry
- **Todos view** — merged, deduplicated todo list across all sessions for a project; filter by status, sort by any column, expand descriptions with an accordion, and add / edit / archive todos inline
- **Settings** — override the default `~/.copilot/session-state` scan path

All data is stored in a local SQLite registry inside your app data directory. No network access.

---

## Getting started

```bash
# Install dependencies
bun install

# Run in development mode (uses bundled assets)
bun run dev

# Run with Vite HMR (live reload during renderer development)
bun run dev:hmr

# Build a release
bun run build:canary
```

---

## Development scripts

| Script | Description |
|---|---|
| `bun run dev` | Build renderer then launch Electrobun |
| `bun run dev:hmr` | Start Vite dev server + Electrobun concurrently |
| `bun run build:canary` | Production build |
| `bun run test` | Run all tests (Bun + Vitest) |
| `bun run test:bun` | Bun tests only (backend logic) |
| `bun run test:ui` | Vitest tests only (React components) |
| `bun run lint` | ESLint all TypeScript sources |
| `bun run format` | Prettier all sources |

---

## Project structure

```
src/
├── shared/               # RPC types and DTOs shared between processes
├── bun/                  # Main process (Bun runtime)
│   ├── index.ts          # Window creation and RPC handler wiring
│   ├── domain/           # Pure TypeScript interfaces
│   ├── infrastructure/   # SQLite adapters, filesystem scanner
│   └── application/      # Use-case functions (scan, manage todos, migrate)
└── mainview/             # Renderer process (React + Tailwind + Vite)
    ├── context/          # Global app state (useReducer)
    ├── hooks/            # useRpc — typed IPC to the Bun process
    ├── pages/            # ProjectsPage, SessionsPage, TodosPage, SettingsPage
    └── components/       # ProjectCard, SessionsTable, TodosTable, modals
```

---

## License

GNU General Public License v2.0 — see [LICENSE](LICENSE) and [LICENSES.md](LICENSES.md).

