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

import { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useRpc } from '../hooks/useRpc';
import { SessionsTable } from '../components/SessionsTable';

/**
 * Page showing all sessions for the currently selected project.
 * Provides breadcrumb navigation, per-session migration, and a Migrate All button.
 */
export function SessionsPage(): React.JSX.Element {
  const { state, dispatch } = useAppContext();
  const rpc = useRpc();
  const project = state.currentProject;

  /**
   * Loads sessions for the current project from the registry.
   */
  async function loadSessions(): Promise<void> {
    if (!project) return;
    dispatch({ type: 'SET_LOADING', isLoading: true });
    try {
      const sessions = await rpc.request.getSessions({ projectId: project.id });
      dispatch({ type: 'SET_SESSIONS', sessions });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: String(err) });
    } finally {
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  }

  useEffect(() => {
    void loadSessions();
  }, [project?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Migrates all sessions for the current project into the registry.
   */
  async function handleMigrateAll(): Promise<void> {
    if (!project) return;
    dispatch({ type: 'SET_LOADING', isLoading: true });
    try {
      await rpc.request.migrateSessions({ projectId: project.id });
      await loadSessions();
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: String(err) });
    } finally {
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  }

  /**
   * Triggers migration for a single session by re-using the project-level
   * migrate endpoint (which will re-read all sessions).
   * @param _sessionId Session ID (unused — we migrate at project level).
   */
  async function handleMigrateSession(_sessionId: string): Promise<void> {
    await handleMigrateAll();
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <button
          onClick={() => dispatch({ type: 'SET_PAGE', page: 'projects' })}
          className="hover:text-indigo-600 transition-colors"
        >
          Projects
        </button>
        <span>›</span>
        <span className="text-gray-900 font-medium">{project?.name ?? '—'}</span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              dispatch({ type: 'SET_PAGE', page: 'todos' });
            }}
            className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50
                       rounded-lg hover:bg-indigo-100 transition-colors"
          >
            View Todos
          </button>
          <button
            onClick={handleMigrateAll}
            disabled={state.isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600
                       rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            Migrate All
          </button>
        </div>
      </div>

      {state.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {state.error}
        </div>
      )}

      {state.isLoading ? (
        <p className="text-center text-gray-500 py-20">Loading…</p>
      ) : (
        <SessionsTable sessions={state.sessions} onMigrate={handleMigrateSession} />
      )}
    </div>
  );
}
