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

import React, { useState } from 'react';
import type { TodoDto } from '../../shared/types';
import { StatusBadge } from './StatusBadge';

const STATUS_OPTIONS = ['pending', 'in_progress', 'done', 'blocked'];

/** Columns that support sorting. */
type SortKey = 'title' | 'status' | 'sessionCount' | 'updatedAt';
type SortDir = 'asc' | 'desc';

interface SortState {
  key: SortKey;
  dir: SortDir;
}

interface TodosTableProps {
  todos: TodoDto[];
  onAdd: () => void;
  onEdit: (todo: TodoDto) => void;
  onArchive: (todo: TodoDto) => void;
  onChangeStatus: (todo: TodoDto, status: string) => void;
}

/**
 * Formats a Unix timestamp as a short locale date string.
 * @param ts Unix timestamp in milliseconds.
 */
function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString();
}

/**
 * Sort indicator icon shown in column headers.
 * @param dir Current sort direction, or undefined when the column is inactive.
 */
function SortIcon({ dir }: { dir: SortDir | undefined }): React.JSX.Element {
  return (
    <span className="inline-flex flex-col ml-1 opacity-60 leading-none">
      <svg
        className={`w-2.5 h-2.5 ${dir === 'asc' ? 'opacity-100' : 'opacity-30'}`}
        viewBox="0 0 8 5"
        fill="currentColor"
      >
        <path d="M4 0L8 5H0L4 0Z" />
      </svg>
      <svg
        className={`w-2.5 h-2.5 ${dir === 'desc' ? 'opacity-100' : 'opacity-30'}`}
        viewBox="0 0 8 5"
        fill="currentColor"
      >
        <path d="M4 5L0 0H8L4 5Z" />
      </svg>
    </span>
  );
}

/**
 * Sortable column header button.
 * @param label Display text.
 * @param sortKey The key this column sorts by.
 * @param sort Current sort state.
 * @param onSort Callback to update sort state.
 */
function SortableHeader({
  label,
  sortKey,
  sort,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onSort: (key: SortKey) => void;
}): React.JSX.Element {
  const isActive = sort.key === sortKey;
  return (
    <button
      onClick={() => onSort(sortKey)}
      className={`flex items-center gap-0.5 font-medium transition-colors
                  ${isActive ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'}`}
    >
      {label}
      <SortIcon dir={isActive ? sort.dir : undefined} />
    </button>
  );
}

/**
 * Chevron icon that rotates when expanded.
 * @param expanded Whether the row is currently expanded.
 */
function ChevronIcon({ expanded }: { expanded: boolean }): React.JSX.Element {
  return (
    <svg
      className={`w-4 h-4 text-gray-400 transition-transform duration-150 shrink-0
                  ${expanded ? 'rotate-90' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

/**
 * Renders a filterable table of todos with per-row accordion expansion for
 * the full description, plus add, edit, archive, and status-change actions.
 */
export function TodosTable({
  todos,
  onAdd,
  onEdit,
  onArchive,
  onChangeStatus,
}: TodosTableProps): React.JSX.Element {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortState>({ key: 'updatedAt', dir: 'desc' });

  /**
   * Toggles sort direction if the column is already active, otherwise
   * switches to the new column with ascending order.
   * @param key The column to sort by.
   */
  function handleSort(key: SortKey): void {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' },
    );
  }

  const filtered = statusFilter === 'all' ? todos : todos.filter((t) => t.status === statusFilter);

  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    switch (sort.key) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'sessionCount':
        comparison = a.sessionIds.length - b.sessionIds.length;
        break;
      case 'updatedAt':
        comparison = a.updatedAt - b.updatedAt;
        break;
    }
    return sort.dir === 'asc' ? comparison : -comparison;
  });

  /**
   * Toggles the accordion expansion for a single todo row.
   * @param todoId The todo's UUID.
   */
  function toggleExpanded(todoId: string): void {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(todoId)) {
        next.delete(todoId);
      } else {
        next.add(todoId);
      }
      return next;
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600 font-medium">Filter:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5
                       focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={onAdd}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium
                     rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + Add Todo
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-center text-gray-500 py-10">No todos found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-8 px-3 py-3" aria-label="Expand" />
                <th className="px-4 py-3 text-left">
                  <SortableHeader label="Title" sortKey="title" sort={sort} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortableHeader label="Status" sortKey="status" sort={sort} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortableHeader
                    label="Sessions"
                    sortKey="sessionCount"
                    sort={sort}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortableHeader
                    label="Updated"
                    sortKey="updatedAt"
                    sort={sort}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {sorted.map((todo) => {
                const isExpanded = expandedIds.has(todo.id);
                const hasDescription = Boolean(todo.description?.trim());

                return (
                  <React.Fragment key={todo.id}>
                    <tr
                      className={`transition-colors ${isExpanded ? 'bg-indigo-50/40' : 'hover:bg-gray-50'}`}
                    >
                      {/* Accordion toggle */}
                      <td className="px-3 py-3">
                        {hasDescription && (
                          <button
                            onClick={() => toggleExpanded(todo.id)}
                            aria-expanded={isExpanded}
                            aria-label={isExpanded ? 'Collapse description' : 'Expand description'}
                            className="flex items-center justify-center w-6 h-6 rounded
                                       hover:bg-gray-200 transition-colors"
                          >
                            <ChevronIcon expanded={isExpanded} />
                          </button>
                        )}
                      </td>

                      <td
                        className="px-4 py-3 max-w-xs cursor-pointer select-none"
                        onClick={() => hasDescription && toggleExpanded(todo.id)}
                      >
                        <p className="font-medium text-gray-900">{todo.title}</p>
                        {!isExpanded && hasDescription && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            {todo.description}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge status={todo.status} />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          title={todo.sessionIds.join(', ')}
                          className="text-xs text-gray-500 cursor-default"
                        >
                          {todo.sessionIds.length}{' '}
                          {todo.sessionIds.length !== 1 ? 'sessions' : 'session'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {formatDate(todo.updatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onEdit(todo)}
                            className="text-xs px-2.5 py-1 rounded bg-gray-100
                                       text-gray-700 hover:bg-gray-200 transition-colors"
                          >
                            Edit
                          </button>
                          <select
                            value={todo.status}
                            onChange={(e) => onChangeStatus(todo, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1
                                       focus:outline-none focus:ring-1 focus:ring-indigo-400"
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {s.replace('_', ' ')}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => onArchive(todo)}
                            className="text-xs px-2.5 py-1 rounded bg-red-50
                                       text-red-600 hover:bg-red-100 transition-colors"
                          >
                            Archive
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Accordion expansion row */}
                    {isExpanded && (
                      <tr key={`${todo.id}-desc`} className="bg-indigo-50/40">
                        <td />
                        <td colSpan={5} className="px-4 pb-4 pt-0">
                          <div className="rounded-lg bg-white border border-indigo-100 p-4">
                            <p
                              className="text-xs font-semibold text-indigo-500 uppercase
                                          tracking-wide mb-2"
                            >
                              Description
                            </p>
                            <pre
                              className="text-sm text-gray-700 whitespace-pre-wrap
                                           font-sans leading-relaxed"
                            >
                              {todo.description}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
