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

import React, { useCallback, useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useRpc } from '../hooks/useRpc';

/**
 * Settings page.
 * Allows the user to configure the path to their Copilot session-state
 * directory and view read-only application metadata.
 */
export const SettingsPage: React.FC = () => {
  const { dispatch } = useAppContext();
  const rpc = useRpc();

  const [copilotPath, setCopilotPath] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  /** Loads current settings from the main process on mount. */
  useEffect(() => {
    rpc
      .request('getSettings', {})
      .then((settings) => {
        setCopilotPath(settings.copilotPath);
      })
      .catch((err: unknown) => {
        console.error('Failed to load settings:', err);
      });
  }, [rpc]);

  /** Navigates back to the projects landing page. */
  const handleBack = useCallback(() => {
    dispatch({ type: 'SET_PAGE', page: 'projects' });
  }, [dispatch]);

  /** Persists the current form values to the main process. */
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await rpc.request('updateSettings', { copilotPath });
      setSaveSuccess(true);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  }, [rpc, copilotPath]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 bg-white">
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          aria-label="Back to projects"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 max-w-2xl">
        {/* Copilot directory section */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Copilot Session Directory
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            The application will scan this directory for Copilot session folders. Defaults to{' '}
            <code className="bg-gray-100 px-1 rounded text-gray-700 text-xs">
              ~/.copilot/session-state
            </code>
            .
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={copilotPath}
              onChange={(e) => {
                setCopilotPath(e.target.value);
                setSaveSuccess(false);
              }}
              placeholder="/path/to/.copilot/session-state"
              className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              aria-label="Copilot session-state directory path"
            />
            <button
              onClick={handleSave}
              disabled={isSaving || !copilotPath.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm rounded transition-colors whitespace-nowrap"
            >
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>

          {/* Feedback messages */}
          {saveSuccess && (
            <p className="mt-2 text-sm text-green-400" role="status">
              Settings saved. Changes take effect on the next scan.
            </p>
          )}
          {saveError && (
            <p className="mt-2 text-sm text-red-400" role="alert">
              {saveError}
            </p>
          )}
        </section>

        {/* About section */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            About
          </h2>
          <dl className="space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="text-gray-500 w-32 shrink-0">Application</dt>
              <dd className="text-gray-900">Copilot Issue Tracker</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-gray-500 w-32 shrink-0">License</dt>
              <dd className="text-gray-900">GNU General Public License v2.0</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
};
