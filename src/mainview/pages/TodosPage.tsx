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

import { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useRpc } from '../hooks/useRpc';
import { TodosTable } from '../components/TodosTable';
import { AddEditTodoModal } from '../components/modals/AddEditTodoModal';
import { ConfirmModal } from '../components/modals/ConfirmModal';
import type { TodoDto } from '../../shared/types';

/**
 * Page displaying the todos for the currently selected project.
 * Supports adding, editing, archiving, and changing todo status.
 */
export function TodosPage(): React.JSX.Element {
  const { state, dispatch } = useAppContext();
  const rpc = useRpc();
  const project = state.currentProject;

  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoDto | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<TodoDto | null>(null);

  /**
   * Loads todos for the current project from the registry.
   */
  async function loadTodos(): Promise<void> {
    if (!project) return;
    dispatch({ type: 'SET_LOADING', isLoading: true });
    try {
      const todos = await rpc.request.getProjectTodos({ projectId: project.id });
      dispatch({ type: 'SET_TODOS', todos });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: String(err) });
    } finally {
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  }

  useEffect(() => {
    void loadTodos();
  }, [project?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Opens the add-todo modal with a blank form.
   */
  function handleAdd(): void {
    setEditingTodo(null);
    setIsAddEditOpen(true);
  }

  /**
   * Opens the edit modal pre-populated with the selected todo.
   * @param todo The todo to edit.
   */
  function handleEdit(todo: TodoDto): void {
    setEditingTodo(todo);
    setIsAddEditOpen(true);
  }

  /**
   * Opens the archive confirmation dialog.
   * @param todo The todo to archive.
   */
  function handleArchive(todo: TodoDto): void {
    setConfirmArchive(todo);
  }

  /**
   * Persists the add/edit form submission via RPC.
   * @param data Form values.
   */
  async function handleSave(data: {
    title: string;
    description: string;
    status: string;
  }): Promise<void> {
    if (!project) return;
    try {
      if (editingTodo) {
        await rpc.request.updateTodo({
          todoId: editingTodo.id,
          ...data,
        });
      } else {
        await rpc.request.addTodo({ projectId: project.id, ...data });
      }
      setIsAddEditOpen(false);
      await loadTodos();
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: String(err) });
    }
  }

  /**
   * Confirms and executes the archive action.
   */
  async function handleConfirmArchive(): Promise<void> {
    if (!confirmArchive) return;
    try {
      await rpc.request.archiveTodo({ todoId: confirmArchive.id });
      setConfirmArchive(null);
      await loadTodos();
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: String(err) });
    }
  }

  /**
   * Changes a todo's status inline.
   * @param todo The todo to update.
   * @param status New status value.
   */
  async function handleChangeStatus(todo: TodoDto, status: string): Promise<void> {
    try {
      await rpc.request.updateTodo({ todoId: todo.id, status });
      await loadTodos();
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: String(err) });
    }
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <button
          onClick={() => dispatch({ type: 'SET_PAGE', page: 'projects' })}
          className="hover:text-indigo-600 transition-colors"
        >
          Projects
        </button>
        <span>›</span>
        <button
          onClick={() => dispatch({ type: 'SET_PAGE', page: 'sessions' })}
          className="hover:text-indigo-600 transition-colors"
        >
          {project?.name ?? '—'}
        </button>
        <span>›</span>
        <span className="text-gray-900 font-medium">Todos</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Todos</h1>

      {state.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {state.error}
        </div>
      )}

      {state.isLoading ? (
        <p className="text-center text-gray-500 py-20">Loading…</p>
      ) : (
        <TodosTable
          todos={state.todos}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onArchive={handleArchive}
          onChangeStatus={handleChangeStatus}
        />
      )}

      <AddEditTodoModal
        isOpen={isAddEditOpen}
        todo={editingTodo}
        projectId={project?.id ?? ''}
        onClose={() => setIsAddEditOpen(false)}
        onSave={handleSave}
      />

      <ConfirmModal
        isOpen={confirmArchive !== null}
        title="Archive Todo"
        message={`Are you sure you want to archive "${confirmArchive?.title ?? ''}"?`}
        confirmLabel="Archive"
        onConfirm={handleConfirmArchive}
        onCancel={() => setConfirmArchive(null)}
      />
    </div>
  );
}
