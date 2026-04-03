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

import React from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { ProjectsPage } from './pages/ProjectsPage';
import { SessionsPage } from './pages/SessionsPage';
import { TodosPage } from './pages/TodosPage';
import { SettingsPage } from './pages/SettingsPage';

/**
 * Top-level navigation bar with app title and a Settings button.
 */
function NavBar(): React.JSX.Element {
  const { dispatch, state } = useAppContext();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-xl">🔍</span>
        <span className="font-semibold text-gray-900 text-lg">Copilot Issue Tracker</span>
      </div>
      <button
        onClick={() => dispatch({ type: 'SET_PAGE', page: 'settings' })}
        title="Settings"
        aria-label="Open settings"
        className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
          state.currentPage === 'settings'
            ? 'bg-gray-200 text-gray-900'
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        ⚙ Settings
      </button>
    </header>
  );
}

/**
 * Inner app component that reads route state from context and renders
 * the appropriate page.
 */
function AppRouter(): React.JSX.Element {
  const { state } = useAppContext();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />
      <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
        {state.currentPage === 'projects' && <ProjectsPage />}
        {state.currentPage === 'sessions' && <SessionsPage />}
        {state.currentPage === 'todos' && <TodosPage />}
        {state.currentPage === 'settings' && <SettingsPage />}
      </main>
    </div>
  );
}

/**
 * Root application component. Wraps the router in the app-wide context provider.
 */
function App(): React.JSX.Element {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}

export default App;
