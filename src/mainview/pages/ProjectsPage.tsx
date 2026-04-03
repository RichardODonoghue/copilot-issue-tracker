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

import { useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { useRpc } from '../hooks/useRpc';
import { ProjectCard } from '../components/ProjectCard';
import type { ProjectDto } from '../../shared/types';

/**
 * Main landing page showing all discovered projects as cards.
 * On first mount it triggers both a scan and a projects fetch.
 */
export function ProjectsPage(): React.JSX.Element {
  const { state, dispatch } = useAppContext();
  const rpc = useRpc();
  const hasScanned = useRef(false);

  /**
   * Fetches the project list from the registry and updates context state.
   */
  async function loadProjects(): Promise<void> {
    dispatch({ type: 'SET_LOADING', isLoading: true });
    dispatch({ type: 'SET_ERROR', error: null });
    try {
      const projects = await rpc.request.getProjects({});
      dispatch({ type: 'SET_PROJECTS', projects });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: String(err) });
    } finally {
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  }

  /**
   * Triggers a full scan of ~/.copilot/session-state and then reloads projects.
   */
  async function handleScan(): Promise<void> {
    dispatch({ type: 'SET_SCAN_PROGRESS', progress: { stage: 'Scanning…', progress: 0 } });
    try {
      await rpc.request.scanAndSyncSessions({});
      dispatch({ type: 'SET_SCAN_PROGRESS', progress: { stage: 'Done', progress: 100 } });
      await loadProjects();
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: String(err) });
    } finally {
      setTimeout(() => dispatch({ type: 'SET_SCAN_PROGRESS', progress: null }), 1500);
    }
  }

  useEffect(() => {
    if (hasScanned.current) return;
    hasScanned.current = true;
    void handleScan();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Navigates to the sessions view for the selected project.
   * @param project The project the user clicked.
   */
  function handleProjectClick(project: ProjectDto): void {
    dispatch({ type: 'SET_CURRENT_PROJECT', project });
    dispatch({ type: 'SET_PAGE', page: 'sessions' });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <div className="flex items-center gap-3">
          {state.scanProgress && (
            <span className="text-sm text-indigo-600 animate-pulse">
              {state.scanProgress.stage}
            </span>
          )}
          <button
            onClick={handleScan}
            disabled={state.isLoading}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium
                       rounded-lg hover:bg-indigo-700 disabled:opacity-50
                       transition-colors"
          >
            🔄 Scan Sessions
          </button>
        </div>
      </div>

      {state.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {state.error}
        </div>
      )}

      {state.isLoading && state.projects.length === 0 ? (
        <p className="text-center text-gray-500 py-20">Loading…</p>
      ) : state.projects.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 mb-2">No projects found.</p>
          <p className="text-sm text-gray-400">
            Click "Scan Sessions" to discover Copilot sessions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {state.projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => handleProjectClick(project)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
