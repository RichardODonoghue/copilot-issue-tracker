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

import type { ProjectDto } from '../../shared/types';

interface ProjectCardProps {
  project: ProjectDto;
  onClick: () => void;
}

/**
 * Formats a Unix timestamp as a human-readable relative time string.
 * @param timestamp Unix timestamp in milliseconds.
 * @returns Relative time string (e.g. "2 hours ago").
 */
function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Displays a project as a clickable card with name, session/todo counts
 * and relative last-updated time.
 */
export function ProjectCard({ project, onClick }: ProjectCardProps): React.JSX.Element {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      title={project.cwd}
      className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm
                 hover:shadow-md hover:border-indigo-300 cursor-pointer
                 transition-all duration-150 select-none"
    >
      <h2 className="text-lg font-semibold text-gray-900 truncate mb-1">{project.name}</h2>
      <p className="text-xs text-gray-400 truncate mb-4">{project.cwd}</p>

      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="inline-flex items-center gap-1 rounded-full bg-indigo-50
                         text-indigo-700 text-xs font-medium px-2.5 py-0.5"
        >
          <span>📁</span>
          {project.sessionCount} {project.sessionCount === 1 ? 'session' : 'sessions'}
        </span>
        <span
          className="inline-flex items-center gap-1 rounded-full bg-amber-50
                         text-amber-700 text-xs font-medium px-2.5 py-0.5"
        >
          <span>✅</span>
          {project.todoCount} {project.todoCount === 1 ? 'todo' : 'todos'}
        </span>
      </div>

      <p className="text-xs text-gray-400 mt-3">Updated {formatRelativeTime(project.updatedAt)}</p>
    </div>
  );
}
