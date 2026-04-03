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

import type { SessionDto } from '../../shared/types';

interface SessionsTableProps {
  sessions: SessionDto[];
  onMigrate: (sessionId: string) => void;
}

/**
 * Formats a Unix timestamp as a locale date/time string.
 * @param ts Unix timestamp in milliseconds.
 */
function formatDate(ts: number): string {
  return new Date(ts).toLocaleString();
}

/**
 * Displays a sortable table of sessions for a project.
 * Sessions are sorted newest-first by last_modified.
 * Provides a Migrate action for sessions that have a session.db.
 */
export function SessionsTable({ sessions, onMigrate }: SessionsTableProps): React.JSX.Element {
  const sorted = [...sessions].sort((a, b) => b.lastModified - a.lastModified);

  if (sorted.length === 0) {
    return <p className="text-center text-gray-500 py-10">No sessions found.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Session Name</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Session Path</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">DB</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Last Modified</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {sorted.map((session) => (
            <tr key={session.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-mono text-xs text-gray-800">{session.sessionName}</td>
              <td className="px-4 py-3 max-w-xs">
                <span
                  title={session.sessionPath}
                  className="block truncate text-xs text-gray-500 font-mono"
                >
                  {session.sessionPath}
                </span>
              </td>
              <td className="px-4 py-3">
                {session.hasDb ? (
                  <span className="text-green-600 font-medium">Yes</span>
                ) : (
                  <span className="text-gray-400">No</span>
                )}
              </td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                {formatDate(session.lastModified)}
              </td>
              <td className="px-4 py-3">
                {session.hasDb && (
                  <button
                    onClick={() => onMigrate(session.id)}
                    className="text-xs px-3 py-1 rounded bg-indigo-50 text-indigo-700
                               hover:bg-indigo-100 transition-colors"
                  >
                    Migrate
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
