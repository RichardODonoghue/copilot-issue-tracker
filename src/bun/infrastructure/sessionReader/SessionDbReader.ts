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

import { Database } from 'bun:sqlite';
import type { SessionTodo } from '../../domain/entities';

/** Raw row type as returned by SQLite for the todos table in session.db. */
interface RawTodoRow {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: number;
  updated_at: number;
}

/** Raw row type for the todo_deps table in session.db. */
interface RawDepRow {
  todo_id: string;
  depends_on: string;
}

/**
 * Read-only adapter for an external Copilot session.db SQLite file.
 * Handles schema variations gracefully so a corrupt or outdated db
 * does not crash the scan process.
 */
export class SessionDbReader {
  private readonly db: Database;

  /**
   * Opens a read-only connection to the session database.
   * @param dbPath Absolute path to the session.db file.
   */
  constructor(dbPath: string) {
    this.db = new Database(dbPath, { readonly: true });
  }

  /**
   * Reads all non-archived todos from the session database.
   * Returns an empty array if the todos table doesn't exist or is malformed.
   * @returns Array of SessionTodo objects.
   */
  getTodos(): SessionTodo[] {
    try {
      const rows = this.db
        .query<RawTodoRow, []>(
          `SELECT id, title, description, status, created_at, updated_at
           FROM todos
           WHERE status != 'archived'
           ORDER BY updated_at DESC`,
        )
        .all();

      return rows.map((row) => ({
        id: row.id,
        title: row.title ?? '',
        description: row.description ?? '',
        status: row.status ?? 'pending',
        createdAt: row.created_at ?? Date.now(),
        updatedAt: row.updated_at ?? Date.now(),
      }));
    } catch {
      return [];
    }
  }

  /**
   * Reads all todo dependency relationships from the session database.
   * Returns an empty array if the todo_deps table doesn't exist.
   * @returns Array of dependency pairs.
   */
  getDeps(): { todoId: string; dependsOn: string }[] {
    try {
      const rows = this.db.query<RawDepRow, []>('SELECT todo_id, depends_on FROM todo_deps').all();

      return rows.map((row) => ({
        todoId: row.todo_id,
        dependsOn: row.depends_on,
      }));
    } catch {
      return [];
    }
  }

  /** Closes the database connection. */
  close(): void {
    this.db.close();
  }
}
