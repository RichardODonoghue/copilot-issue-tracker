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

interface StatusBadgeProps {
  status: string;
}

/** Maps a status string to Tailwind color classes. */
const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
  blocked: 'bg-red-100 text-red-700',
};

/**
 * Renders a colored pill badge representing a todo status.
 */
export function StatusBadge({ status }: StatusBadgeProps): React.JSX.Element {
  const styles = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-700';
  const label = status.replace('_', ' ');
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles}`}
    >
      {label}
    </span>
  );
}
