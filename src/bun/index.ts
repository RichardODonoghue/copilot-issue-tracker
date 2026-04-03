/**
 * copilot-issue-tracker - GitHub Copilot session database viewer
 * Copyright (C) 2026  Contributors
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 */

import { BrowserWindow, BrowserView, Utils } from 'electrobun/bun';
import { mkdirSync } from 'node:fs';
import type { AppRPCType } from '../shared/types';
import { RegistryDatabase } from './infrastructure/database/RegistryDatabase';
import { scanAndSyncSessions } from './application/useCases/scanAndSyncSessions';
import { migrateSessions } from './application/useCases/migrateSessions';
import { addTodo, updateTodo, archiveTodo } from './application/useCases/manageTodo';

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

const dbPath = Utils.paths.userData + '/registry.db';
const defaultCopilotPath = Utils.paths.home + '/.copilot/session-state';

// Ensure the app data directory exists before SQLite tries to open a file in it.
mkdirSync(Utils.paths.userData, { recursive: true });

/** Singleton registry database for the lifetime of the process. */
const db = new RegistryDatabase(dbPath);

/**
 * Returns the active copilot session-state path.
 * Uses the user-configured override if set, otherwise the default.
 */
function getCopilotPath(): string {
  return db.getSetting('copilotPath') ?? defaultCopilotPath;
}

/**
 * Determines the URL to load in the main window.
 * Only uses the Vite dev server when the COPILOT_TRACKER_HMR environment
 * variable is explicitly set (i.e. when launched via `bun run dev:hmr`).
 * Plain `bun run dev` always loads the bundled assets so it cannot
 * accidentally connect to an unrelated Vite server on the same port.
 * @returns The URL string to load in BrowserWindow.
 */
async function getMainViewUrl(): Promise<string> {
  if (process.env['COPILOT_TRACKER_HMR'] === '1') {
    try {
      await fetch(DEV_SERVER_URL, { method: 'HEAD' });
      console.log(`HMR enabled: Using Vite dev server at ${DEV_SERVER_URL}`);
      return DEV_SERVER_URL;
    } catch {
      console.log('Vite dev server not running — falling back to bundled assets.');
    }
  }
  return 'views://mainview/index.html';
}

const rpc = BrowserView.defineRPC<AppRPCType>({
  handlers: {
    requests: {
      /**
       * Triggers a full scan of ~/.copilot/session-state and syncs
       * all discovered sessions and todos into the registry.
       */
      scanAndSyncSessions: async () => {
        try {
          const counts = await scanAndSyncSessions(db, getCopilotPath());
          return {
            success: true,
            projectCount: counts.projectCount,
            sessionCount: counts.sessionCount,
          };
        } catch (err) {
          console.error('scanAndSyncSessions error:', err);
          return { success: false, projectCount: 0, sessionCount: 0 };
        }
      },

      /** Returns all projects from the registry with aggregated counts. */
      getProjects: async () => {
        return db.getProjects();
      },

      /** Returns all sessions for the given project. */
      getSessions: async ({ projectId }) => {
        return db.getSessionsByProjectId(projectId);
      },

      /** Returns all non-archived todos for the given project. */
      getProjectTodos: async ({ projectId }) => {
        return db.getTodosByProjectId(projectId);
      },

      /** Creates a new todo in the registry. */
      addTodo: async ({ projectId, title, description, status }) => {
        return addTodo(db, projectId, title, description, status);
      },

      /** Updates mutable fields on an existing todo. */
      updateTodo: async ({ todoId, title, description, status }) => {
        const result = updateTodo(db, todoId, { title, description, status });
        if (!result) throw new Error(`Todo not found: ${todoId}`);
        return result;
      },

      /** Archives (soft-deletes) a todo. */
      archiveTodo: async ({ todoId }) => {
        return archiveTodo(db, todoId);
      },

      /**
       * Re-scans and merges todos from all sessions belonging to the
       * given project into the registry.
       */
      migrateSessions: async ({ projectId }) => {
        const result = await migrateSessions(db, projectId);
        return { success: result.success, count: result.count };
      },

      /** Returns current application settings. */
      getSettings: async () => {
        return {
          copilotPath: db.getSetting('copilotPath') ?? defaultCopilotPath,
        };
      },

      /** Persists updated application settings. */
      updateSettings: async ({ copilotPath }) => {
        db.setSetting('copilotPath', copilotPath);
        return { success: true };
      },
    },
    messages: {},
  },
});

const url = await getMainViewUrl();

new BrowserWindow({
  title: 'Copilot Issue Tracker',
  url,
  frame: {
    width: 1200,
    height: 800,
    x: 100,
    y: 100,
  },
  rpc,
});

console.log('Copilot Issue Tracker started!');
