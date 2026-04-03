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

import type { RegistryDatabase } from '../../infrastructure/database/RegistryDatabase';
import type { Todo } from '../../domain/entities';
import type { TodoDto } from '../../../shared/types';

/**
 * Creates a new todo in the registry for the given project.
 * @param db Open RegistryDatabase instance.
 * @param projectId UUID of the target project.
 * @param title Short title for the todo.
 * @param description Detailed description.
 * @param status Initial status (e.g. 'pending', 'in_progress').
 * @returns The created TodoDto.
 */
export function addTodo(
  db: RegistryDatabase,
  projectId: string,
  title: string,
  description: string,
  status: string,
): TodoDto {
  const now = Date.now();
  const todo = db.upsertTodo({
    projectId,
    externalId: null,
    title,
    description,
    status,
    isArchived: false,
    sessionIds: [],
    sourceMetadata: {},
    createdAt: now,
    updatedAt: now,
  });

  return {
    id: todo.id,
    projectId: todo.projectId,
    externalId: todo.externalId,
    title: todo.title,
    description: todo.description,
    status: todo.status,
    isArchived: todo.isArchived,
    sessionIds: todo.sessionIds,
    createdAt: todo.createdAt,
    updatedAt: todo.updatedAt,
  };
}

/**
 * Applies partial updates to an existing todo.
 * @param db Open RegistryDatabase instance.
 * @param todoId UUID of the todo to update.
 * @param updates Fields to update (title, description, and/or status).
 * @returns The updated TodoDto, or null if the todo was not found.
 */
export function updateTodo(
  db: RegistryDatabase,
  todoId: string,
  updates: Partial<Pick<Todo, 'title' | 'description' | 'status'>>,
): TodoDto | null {
  return db.updateTodo(todoId, updates);
}

/**
 * Soft-deletes a todo by archiving it.
 * Archived todos are hidden from normal queries but retained for history.
 * @param db Open RegistryDatabase instance.
 * @param todoId UUID of the todo to archive.
 * @returns True if a record was updated, false if not found.
 */
export function archiveTodo(db: RegistryDatabase, todoId: string): boolean {
  return db.archiveTodo(todoId);
}
