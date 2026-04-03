# Copilot Instructions

## What this application is

Copilot Issue Tracker is a cross-platform **Electrobun** desktop app (React + Tailwind + Vite) that reads GitHub Copilot session SQLite databases from `~/.copilot/session-state`, groups sessions by project, and provides a unified interface for viewing and managing todos across all sessions.

> **CRITICAL:** This app uses **Electrobun**, not Electron. Never use Electron APIs, patterns, or imports. They are incompatible.

---

## Commands

```bash
bun run dev           # Build renderer then launch Electrobun (no HMR)
bun run dev:hmr       # Vite dev server + Electrobun concurrently (with HMR)
bun run build:canary  # Production build
bun run test          # Run all tests (bun:test + vitest)
bun run test:bun      # Bun tests only  (src/bun/**/*.test.ts)
bun run test:ui       # Vitest tests only (src/mainview/**/__tests__/*.tsx?)
bun run test:watch    # Vitest in watch mode
bun run lint          # ESLint all TypeScript sources
bun run lint:fix      # ESLint auto-fix
bun run format        # Prettier all sources
```

Run a single Bun test file:
```bash
bun test src/bun/infrastructure/database/__tests__/RegistryDatabase.test.ts
```

Run a single Vitest test file:
```bash
bun x vitest run src/mainview/components/__tests__/ProjectCard.test.tsx
```

---

## Architecture

Clean Architecture with strict layer separation. All SQLite and filesystem I/O is confined to the **Bun process**. The renderer calls the Bun process via typed RPC only.

```
src/
├── shared/
│   └── types.ts                     # AppRPCType, AppSettings, ProjectDto, SessionDto, TodoDto
│
├── bun/                             # Bun (main) process — no DOM, no Electron
│   ├── index.ts                     # BrowserWindow creation + all RPC handler wiring
│   ├── domain/
│   │   └── entities.ts              # Pure interfaces: Project, Session, Todo, MigrationRecord
│   ├── infrastructure/
│   │   ├── database/
│   │   │   └── RegistryDatabase.ts  # bun:sqlite schema + CRUD + settings key/value store
│   │   ├── scanner/
│   │   │   ├── SessionScanner.ts    # Reads ~/.copilot/session-state directory tree
│   │   │   └── WorkspaceYamlParser.ts  # Parses workspace.yaml (no external YAML lib)
│   │   └── sessionReader/
│   │       └── SessionDbReader.ts   # Read-only adapter for external session.db files
│   └── application/
│       └── useCases/
│           ├── scanAndSyncSessions.ts  # Full scan → upsert pipeline
│           ├── manageTodo.ts           # addTodo / updateTodo / archiveTodo
│           └── migrateSessions.ts      # Re-sync todos from a project's session.db files
│
└── mainview/                        # Renderer process — React + Vite + Tailwind
    ├── App.tsx                      # AppRouter (state-based routing) + NavBar
    ├── main.tsx                     # React root mount
    ├── context/
    │   └── AppContext.tsx           # Global state (useReducer), AppProvider, AppAction union
    ├── hooks/
    │   └── useRpc.ts                # Singleton Electroview instance; useRpc() hook
    ├── pages/
    │   ├── ProjectsPage.tsx         # Landing page — project card grid + scan button
    │   ├── SessionsPage.tsx         # Sessions table for a selected project
    │   ├── TodosPage.tsx            # Unified todos view with CRUD modals
    │   └── SettingsPage.tsx         # Copilot path override + app info
    └── components/
        ├── ProjectCard.tsx          # Clickable project summary card
        ├── SessionsTable.tsx        # Sessions sorted newest → oldest; per-row migrate action
        ├── TodosTable.tsx           # Filterable, sortable todos table with accordion descriptions
        ├── StatusBadge.tsx          # Coloured pill for todo status
        └── modals/
            ├── AddEditTodoModal.tsx # Create / edit todo form modal
            └── ConfirmModal.tsx     # Generic confirmation dialog
```

---

## Application features

### Projects page (landing)
- Displays all known projects as cards showing name, cwd path, session count, and open todo count.
- **Scan Sessions** button triggers `scanAndSyncSessions` — walks `~/.copilot/session-state`, upserts projects/sessions/todos into the registry.
- Clicking a card navigates to the Sessions page for that project.

### Sessions page
- Lists all sessions for the selected project, sorted newest-first.
- Shows session name, folder path, whether a `session.db` is present, and last-modified date.
- **Migrate** button on each row triggers `migrateSessions` — re-reads that project's session databases and merges any new todos into the registry.

### Todos page
- Merged, deduplicated todo list for the selected project.
- **Filter** by status (`all`, `pending`, `in_progress`, `done`, `blocked`).
- **Sort** by any column (Title, Status, Sessions, Updated) with toggleable asc/desc direction.
- **Accordion** — clicking a row or its chevron expands an inline description panel.
- **Add Todo** — opens `AddEditTodoModal` in create mode.
- **Edit** — opens `AddEditTodoModal` pre-filled with existing values.
- **Status dropdown** — changes status inline without opening a modal.
- **Archive** — soft-deletes the todo (hidden from normal queries, retained in DB).

### Settings page
- Text input to override the default `~/.copilot/session-state` scan path.
- Saved value is persisted in the registry `settings` table and read on every scan.
- Back button returns to the Projects page.

---

## IPC (Electrobun RPC)

**Bun side** (`src/bun/index.ts`):
```ts
import {BrowserView, BrowserWindow, Utils} from 'electrobun/bun';
const rpc = BrowserView.defineRPC<AppRPCType>({
  handlers: {requests: { /* handlers */ }, messages: {}},
});
new BrowserWindow({url, rpc});
```

**Renderer side** (`src/mainview/hooks/useRpc.ts`):
```ts
import {Electroview} from 'electrobun/view';
const electroview = new Electroview({rpc}); // module-level singleton
export const useRpc = () => electroview.rpc;
```

Calling Bun from a component:
```ts
const rpc = useRpc();
const projects = await rpc.request('getProjects', {});
```

### All RPC operations (defined in `src/shared/types.ts`)

| Method | Direction | Description |
|---|---|---|
| `scanAndSyncSessions` | renderer → bun | Walk session-state dir, upsert all data |
| `getProjects` | renderer → bun | Return all projects with aggregated counts |
| `getSessions` | renderer → bun | Return sessions for a project |
| `getProjectTodos` | renderer → bun | Return non-archived todos for a project |
| `addTodo` | renderer → bun | Create a new todo |
| `updateTodo` | renderer → bun | Patch title / description / status |
| `archiveTodo` | renderer → bun | Soft-delete a todo |
| `migrateSessions` | renderer → bun | Re-sync todos from a project's session.db files |
| `getSettings` | renderer → bun | Fetch current app settings |
| `updateSettings` | renderer → bun | Persist app settings |
| `scanProgress` | bun → renderer | Progress push during scan |
| `dataChanged` | bun → renderer | Notify renderer of data mutations |

**Adding a new RPC operation:**
1. Add the method signature to `AppRPCType` in `src/shared/types.ts`
2. Add the handler in `src/bun/index.ts` under `handlers.requests`
3. If it is a bun-pushed message (not a request), add an empty handler in `useRpc.ts`

---

## State management (renderer)

State lives entirely in `AppContext` (`src/mainview/context/AppContext.tsx`) via `useReducer`. There is no react-router.

```ts
interface AppState {
  projects: ProjectDto[];
  currentProject: ProjectDto | null;
  sessions: SessionDto[];
  todos: TodoDto[];
  isLoading: boolean;
  error: string | null;
  currentPage: 'projects' | 'sessions' | 'todos' | 'settings';
  scanProgress: {stage: string; progress: number} | null;
}
```

Navigation is driven by dispatching `SET_PAGE`:
```ts
dispatch({type: 'SET_PAGE', page: 'settings'});
```

---

## Database (RegistryDatabase)

File lives at `Utils.paths.userData + '/registry.db'`. Schema:

- **projects** — `id, name, cwd, created_at, updated_at`
- **sessions** — `id, project_id, session_name, session_path, session_db_path, last_modified`
- **todos** — `id, project_id, external_id, title, description, status, is_archived, session_ids (JSON), source_metadata (JSON), created_at, updated_at`
- **migrations** — `id, summary, created_at` (audit log)
- **settings** — `key, value` (key/value store for app settings)

**Deduplication**: `upsertTodo` dedupes by `(external_id, project_id)`. When the incoming `updated_at` is newer, content fields are updated. `session_ids` is always merged (union) regardless of timestamp.

**Settings**: `getSetting(key)` returns `string | null`; `setSetting(key, value)` upserts.

---

## Electrobun-specific facts

| Thing | Value |
|---|---|
| Bundled asset URL | `views://mainview/index.html` |
| Home directory | `Utils.paths.home` |
| App data directory | `Utils.paths.userData` |
| SQLite | `import {Database} from 'bun:sqlite'` (Bun built-in — bun process only) |
| HMR gate | `process.env['COPILOT_TRACKER_HMR'] === '1'` (set only by `dev:hmr` script) |

The `userData` directory may not exist on first launch. Always call `mkdirSync(Utils.paths.userData, {recursive: true})` before opening the registry database.

---

## Coding standards

- **Google JavaScript Style Guide** — 2-space indent, `camelCase` vars/functions, `PascalCase` classes/types
- **JSDoc required** on every exported function, class, and complex logic block
- **No `any`** — use precise TypeScript types everywhere
- **GPL v2.0 header** in every source file — copy the header from any existing file
- **ESLint + Prettier** must pass before commit (enforced by Husky pre-commit hook)
- **TDD** — write the failing test first, then implement

---

## Testing

| Runner | Scope | Config |
|---|---|---|
| `bun test` | `src/bun/**/__tests__/*.test.ts` | built-in |
| `vitest` | `src/mainview/**/__tests__/*.test.tsx?` | `vitest.config.ts` |

Test setup file: `src/mainview/test/setup.ts` — imports `@testing-library/jest-dom`.

**Bun test pattern:**
```ts
import {describe, test, expect, beforeEach, afterEach} from 'bun:test';
// Use mkdtemp / rm for temporary file fixtures
// Use in-memory RegistryDatabase(join(tmpDir, 'test.db'))
```

**Vitest pattern:**
```ts
import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
// Normalize split text nodes: element.textContent?.replace(/\s+/g, ' ').trim()
```


