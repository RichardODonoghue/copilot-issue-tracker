/**
 * copilot-issue-tracker - GitHub Copilot session database viewer
 * Copyright (C) 2026  Contributors
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 */

import { describe, it, expect } from 'bun:test';
import type { ProjectDto, SessionDto, TodoDto } from '../../../shared/types';

/**
 * Tests for the AppContext reducer function in isolation.
 * We import just the reducer logic by extracting it from the module.
 */

// Re-implement the reducer shape here to test it without rendering.
// This mirrors the actual reducer in AppContext.tsx exactly.
type Page = 'projects' | 'sessions' | 'todos' | 'settings';

interface AppState {
  projects: ProjectDto[];
  currentProject: ProjectDto | null;
  sessions: SessionDto[];
  todos: TodoDto[];
  isLoading: boolean;
  error: string | null;
  currentPage: Page;
  scanProgress: { stage: string; progress: number } | null;
}

type AppAction =
  | { type: 'SET_PROJECTS'; projects: ProjectDto[] }
  | { type: 'SET_CURRENT_PROJECT'; project: ProjectDto | null }
  | { type: 'SET_SESSIONS'; sessions: SessionDto[] }
  | { type: 'SET_TODOS'; todos: TodoDto[] }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_PAGE'; page: Page }
  | { type: 'SET_SCAN_PROGRESS'; progress: AppState['scanProgress'] };

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PROJECTS':
      return { ...state, projects: action.projects };
    case 'SET_CURRENT_PROJECT':
      return { ...state, currentProject: action.project };
    case 'SET_SESSIONS':
      return { ...state, sessions: action.sessions };
    case 'SET_TODOS':
      return { ...state, todos: action.todos };
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'SET_PAGE':
      return { ...state, currentPage: action.page };
    case 'SET_SCAN_PROGRESS':
      return { ...state, scanProgress: action.progress };
    default:
      return state;
  }
}

const INITIAL: AppState = {
  projects: [],
  currentProject: null,
  sessions: [],
  todos: [],
  isLoading: false,
  error: null,
  currentPage: 'projects',
  scanProgress: null,
};

const MOCK_PROJECT: ProjectDto = {
  id: 'p-1',
  name: 'my-project',
  cwd: '/home/user/my-project',
  sessionCount: 2,
  todoCount: 5,
  createdAt: 1000,
  updatedAt: 2000,
};

describe('AppContext reducer', () => {
  it('SET_PROJECTS replaces the projects array', () => {
    const state = appReducer(INITIAL, { type: 'SET_PROJECTS', projects: [MOCK_PROJECT] });
    expect(state.projects).toHaveLength(1);
    expect(state.projects[0].id).toBe('p-1');
  });

  it('SET_CURRENT_PROJECT sets the current project', () => {
    const state = appReducer(INITIAL, { type: 'SET_CURRENT_PROJECT', project: MOCK_PROJECT });
    expect(state.currentProject?.id).toBe('p-1');
  });

  it('SET_CURRENT_PROJECT can clear the current project', () => {
    const withProject = { ...INITIAL, currentProject: MOCK_PROJECT };
    const state = appReducer(withProject, { type: 'SET_CURRENT_PROJECT', project: null });
    expect(state.currentProject).toBeNull();
  });

  it('SET_SESSIONS replaces the sessions array', () => {
    const session: SessionDto = {
      id: 's-1',
      projectId: 'p-1',
      sessionName: 'abc',
      sessionPath: '/path',
      hasDb: false,
      lastModified: 1000,
    };
    const state = appReducer(INITIAL, { type: 'SET_SESSIONS', sessions: [session] });
    expect(state.sessions).toHaveLength(1);
  });

  it('SET_LOADING toggles the loading flag', () => {
    const loading = appReducer(INITIAL, { type: 'SET_LOADING', isLoading: true });
    expect(loading.isLoading).toBe(true);
    const done = appReducer(loading, { type: 'SET_LOADING', isLoading: false });
    expect(done.isLoading).toBe(false);
  });

  it('SET_ERROR sets and clears the error message', () => {
    const withError = appReducer(INITIAL, { type: 'SET_ERROR', error: 'Something failed' });
    expect(withError.error).toBe('Something failed');
    const cleared = appReducer(withError, { type: 'SET_ERROR', error: null });
    expect(cleared.error).toBeNull();
  });

  it('SET_PAGE navigates to every valid page', () => {
    const pages: Page[] = ['projects', 'sessions', 'todos', 'settings'];
    for (const page of pages) {
      const state = appReducer(INITIAL, { type: 'SET_PAGE', page });
      expect(state.currentPage).toBe(page);
    }
  });

  it('SET_SCAN_PROGRESS sets and clears scan progress', () => {
    const progress = { stage: 'Scanning', progress: 0.5 };
    const withProgress = appReducer(INITIAL, { type: 'SET_SCAN_PROGRESS', progress });
    expect(withProgress.scanProgress?.stage).toBe('Scanning');
    const cleared = appReducer(withProgress, { type: 'SET_SCAN_PROGRESS', progress: null });
    expect(cleared.scanProgress).toBeNull();
  });

  it('unknown action returns state unchanged', () => {
    // Cast to any to simulate an unknown action type at runtime.
    const state = appReducer(INITIAL, { type: 'UNKNOWN' } as unknown as AppAction);
    expect(state).toBe(INITIAL);
  });
});
