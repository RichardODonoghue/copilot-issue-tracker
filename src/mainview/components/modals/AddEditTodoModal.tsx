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

import { useState, useEffect } from 'react';
import type { TodoDto } from '../../../shared/types';

const STATUS_OPTIONS = ['pending', 'in_progress', 'done', 'blocked'];

interface AddEditTodoModalProps {
  isOpen: boolean;
  todo: TodoDto | null;
  projectId: string;
  onClose: () => void;
  onSave: (data: { title: string; description: string; status: string }) => void;
}

/**
 * Modal dialog for creating or editing a todo item.
 * Validates that title is non-empty before allowing save.
 */
export function AddEditTodoModal({
  isOpen,
  todo,
  onClose,
  onSave,
}: AddEditTodoModalProps): React.JSX.Element | null {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('pending');
  const [titleError, setTitleError] = useState('');

  // Reset form when the modal opens or the todo changes
  useEffect(() => {
    if (isOpen) {
      setTitle(todo?.title ?? '');
      setDescription(todo?.description ?? '');
      setStatus(todo?.status ?? 'pending');
      setTitleError('');
    }
  }, [isOpen, todo]);

  if (!isOpen) return null;

  /** Validates and submits the form. */
  function handleSubmit(): void {
    if (!title.trim()) {
      setTitleError('Title is required.');
      return;
    }
    onSave({ title: title.trim(), description: description.trim(), status });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {todo ? 'Edit Todo' : 'Add Todo'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleError) setTitleError('');
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Todo title"
            />
            {titleError && <p className="text-xs text-red-500 mt-1">{titleError}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              placeholder="Optional description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100
                       rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600
                       rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {todo ? 'Save Changes' : 'Add Todo'}
          </button>
        </div>
      </div>
    </div>
  );
}
