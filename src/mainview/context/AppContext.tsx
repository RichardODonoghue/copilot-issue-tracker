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

import React, { createContext, useContext, useReducer, type Dispatch } from 'react';
import type { ProjectDto, SessionDto, TodoDto } from '../../shared/types';

/** The full application UI state. */
export interface AppState {
  projects: ProjectDto[];
  currentProject: ProjectDto | null;
  sessions: SessionDto[];
  todos: TodoDto[];
  isLoading: boolean;
  error: string | null;
  currentPage: 'projects' | 'sessions' | 'todos' | 'settings';
  scanProgress: { stage: string; progress: number } | null;
}

/** Union of all dispatchable actions. */
export type AppAction =
  | { type: 'SET_PROJECTS'; projects: ProjectDto[] }
  | { type: 'SET_CURRENT_PROJECT'; project: ProjectDto | null }
  | { type: 'SET_SESSIONS'; sessions: SessionDto[] }
  | { type: 'SET_TODOS'; todos: TodoDto[] }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_PAGE'; page: AppState['currentPage'] }
  | { type: 'SET_SCAN_PROGRESS'; progress: AppState['scanProgress'] };

const initialState: AppState = {
  projects: [],
  currentProject: null,
  sessions: [],
  todos: [],
  isLoading: false,
  error: null,
  currentPage: 'projects',
  scanProgress: null,
};

/**
 * Pure reducer for the application state.
 * @param state Current state.
 * @param action Dispatched action.
 * @returns New state.
 */
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

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | null>(null);

/**
 * Provides the application state context to the component tree.
 * @param props React children.
 */
export function AppProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

/**
 * Consumes the AppContext. Must be used inside an AppProvider.
 * @returns The current state and dispatch function.
 */
export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
