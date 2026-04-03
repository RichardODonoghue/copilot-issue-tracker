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
import type { Project, Session, Todo, MigrationRecord } from '../../domain/entities';
import type { ProjectDto, SessionDto, TodoDto } from '../../../shared/types';

/** Row shape as returned by SQLite for the projects table. */
interface ProjectRow {
  id: string;
  name: string;
  cwd: string;
  created_at: number;
  updated_at: number;
}

/** Row shape for the sessions table including a computed has_db flag. */
interface SessionRow {
  id: string;
  project_id: string;
  session_name: string;
  session_path: string;
  session_db_path: string | null;
  last_modified: number;
  created_at: number;
}

/** Row shape for the todos table. */
interface TodoRow {
  id: string;
  project_id: string;
  external_id: string | null;
  title: string;
  description: string;
  status: string;
  is_archived: number;
  session_ids: string;
  source_metadata: string;
  created_at: number;
  updated_at: number;
}

/** Row shape for aggregated project stats. */
interface ProjectStatsRow {
  project_id: string;
  session_count: number;
  todo_count: number;
}

/**
 * Adapter for the local SQLite registry database.
 * Manages schema creation, upserts, and queries for projects,
 * sessions, todos, and migration records.
 */
export class RegistryDatabase {
  private readonly db: Database;

  /**
   * Opens or creates the registry database at the given path
   * and runs the schema migration to ensure all tables exist.
   * @param dbPath Absolute path to the SQLite database file.
   */
  constructor(dbPath: string) {
    this.db = new Database(dbPath, { create: true });
    this.db.run('PRAGMA journal_mode = WAL;');
    this.db.run('PRAGMA foreign_keys = ON;');
    this.migrateSchema();
  }

  /**
   * Runs idempotent schema migrations to create all required tables.
   */
  private migrateSchema(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        cwd TEXT UNIQUE NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id),
        session_name TEXT NOT NULL,
        session_path TEXT NOT NULL,
        session_db_path TEXT,
        last_modified INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id),
        external_id TEXT,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'pending',
        is_archived INTEGER NOT NULL DEFAULT 0,
        session_ids TEXT NOT NULL DEFAULT '[]',
        source_metadata TEXT NOT NULL DEFAULT '{}',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS migrations (
        id TEXT PRIMARY KEY,
        summary TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);
  }

  /**
   * Inserts or updates a project record identified by its cwd.
   * @param name Human-readable project name (basename of cwd).
   * @param cwd Absolute path of the project working directory.
   * @returns The full Project entity.
   */
  upsertProject(name: string, cwd: string): Project {
    const existing = this.db
      .query<ProjectRow, [string]>('SELECT * FROM projects WHERE cwd = ?')
      .get(cwd);

    if (existing) {
      const now = Date.now();
      this.db
        .query('UPDATE projects SET name = ?, updated_at = ? WHERE id = ?')
        .run(name, now, existing.id);
      return {
        id: existing.id,
        name,
        cwd,
        createdAt: existing.created_at,
        updatedAt: now,
      };
    }

    const id = crypto.randomUUID();
    const now = Date.now();
    this.db
      .query('INSERT INTO projects (id, name, cwd, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
      .run(id, name, cwd, now, now);

    return { id, name, cwd, createdAt: now, updatedAt: now };
  }

  /**
   * Returns all projects with aggregated session and todo counts.
   * @returns Array of ProjectDto objects.
   */
  getProjects(): ProjectDto[] {
    const projects = this.db
      .query<ProjectRow, []>('SELECT * FROM projects ORDER BY updated_at DESC')
      .all();

    const stats = this.db
      .query<ProjectStatsRow, []>(
        `
        SELECT
          p.id AS project_id,
          COUNT(DISTINCT s.id) AS session_count,
          COUNT(DISTINCT t.id) AS todo_count
        FROM projects p
        LEFT JOIN sessions s ON s.project_id = p.id
        LEFT JOIN todos t ON t.project_id = p.id AND t.is_archived = 0
        GROUP BY p.id
      `,
      )
      .all();

    const statsMap = new Map<string, ProjectStatsRow>(stats.map((r) => [r.project_id, r]));

    return projects.map((row) => {
      const s = statsMap.get(row.id);
      return {
        id: row.id,
        name: row.name,
        cwd: row.cwd,
        sessionCount: s?.session_count ?? 0,
        todoCount: s?.todo_count ?? 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });
  }

  /**
   * Finds a project by its cwd path.
   * @param cwd Absolute working directory path.
   * @returns The Project entity or null if not found.
   */
  getProjectByCwd(cwd: string): Project | null {
    const row = this.db
      .query<ProjectRow, [string]>('SELECT * FROM projects WHERE cwd = ?')
      .get(cwd);
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      cwd: row.cwd,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Inserts a session record. If a session with the same session_path already
   * exists, it is updated with the latest last_modified value.
   * @param session Session data to persist.
   * @returns The Session entity.
   */
  insertSession(session: Omit<Session, 'id' | 'createdAt'>): Session {
    const existing = this.db
      .query<
        { id: string; created_at: number },
        [string]
      >('SELECT id, created_at FROM sessions WHERE session_path = ?')
      .get(session.sessionPath);

    if (existing) {
      this.db
        .query('UPDATE sessions SET last_modified = ?, session_db_path = ? WHERE id = ?')
        .run(session.lastModified, session.sessionDbPath, existing.id);
      return {
        id: existing.id,
        createdAt: existing.created_at,
        ...session,
      };
    }

    const id = crypto.randomUUID();
    const now = Date.now();
    this.db
      .query(
        `INSERT INTO sessions
          (id, project_id, session_name, session_path, session_db_path, last_modified, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        session.projectId,
        session.sessionName,
        session.sessionPath,
        session.sessionDbPath,
        session.lastModified,
        now,
      );

    return { id, createdAt: now, ...session };
  }

  /**
   * Returns all sessions for the given project, sorted newest first.
   * @param projectId The project's UUID.
   * @returns Array of SessionDto objects.
   */
  getSessionsByProjectId(projectId: string): SessionDto[] {
    const rows = this.db
      .query<
        SessionRow,
        [string]
      >('SELECT * FROM sessions WHERE project_id = ? ORDER BY last_modified DESC')
      .all(projectId);

    return rows.map((row) => ({
      id: row.id,
      projectId: row.project_id,
      sessionName: row.session_name,
      sessionPath: row.session_path,
      sessionDbPath: row.session_db_path,
      lastModified: row.last_modified,
      createdAt: row.created_at,
      hasDb: row.session_db_path !== null,
    }));
  }

  /**
   * Inserts or updates a todo item using external_id + project_id as the
   * deduplication key. If an existing record is found and the incoming
   * updatedAt is newer, the record is updated.
   * @param todo Todo data to persist.
   * @returns The full Todo entity.
   */
  upsertTodo(todo: Omit<Todo, 'id'>): Todo {
    if (todo.externalId) {
      const existing = this.db
        .query<
          TodoRow,
          [string, string]
        >('SELECT * FROM todos WHERE external_id = ? AND project_id = ?')
        .get(todo.externalId, todo.projectId);

      if (existing) {
        if (todo.updatedAt > existing.updated_at) {
          // Merge session IDs
          const existingIds: string[] = JSON.parse(existing.session_ids ?? '[]');
          const merged = Array.from(new Set([...existingIds, ...todo.sessionIds]));
          this.db
            .query(
              `UPDATE todos SET title = ?, description = ?, status = ?,
               session_ids = ?, updated_at = ? WHERE id = ?`,
            )
            .run(
              todo.title,
              todo.description,
              todo.status,
              JSON.stringify(merged),
              todo.updatedAt,
              existing.id,
            );
        } else {
          // Still merge new session IDs even if we don't update content
          const existingIds: string[] = JSON.parse(existing.session_ids ?? '[]');
          const merged = Array.from(new Set([...existingIds, ...todo.sessionIds]));
          this.db
            .query('UPDATE todos SET session_ids = ? WHERE id = ?')
            .run(JSON.stringify(merged), existing.id);
        }

        const updated = this.db
          .query<TodoRow, [string]>('SELECT * FROM todos WHERE id = ?')
          .get(existing.id)!;
        return this.rowToTodo(updated);
      }
    }

    const id = crypto.randomUUID();
    this.db
      .query(
        `INSERT INTO todos
          (id, project_id, external_id, title, description, status,
           is_archived, session_ids, source_metadata, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        todo.projectId,
        todo.externalId,
        todo.title,
        todo.description,
        todo.status,
        todo.isArchived ? 1 : 0,
        JSON.stringify(todo.sessionIds),
        JSON.stringify(todo.sourceMetadata),
        todo.createdAt,
        todo.updatedAt,
      );

    return { id, ...todo };
  }

  /**
   * Returns all non-archived todos for the given project.
   * @param projectId The project's UUID.
   * @returns Array of TodoDto objects.
   */
  getTodosByProjectId(projectId: string): TodoDto[] {
    const rows = this.db
      .query<TodoRow, [string]>(
        `SELECT * FROM todos
         WHERE project_id = ? AND is_archived = 0
         ORDER BY updated_at DESC`,
      )
      .all(projectId);

    return rows.map((row) => this.rowToTodoDto(row));
  }

  /**
   * Soft-deletes a todo by setting is_archived = 1.
   * @param todoId The todo's UUID.
   * @returns True if a row was updated.
   */
  archiveTodo(todoId: string): boolean {
    const result = this.db.query('UPDATE todos SET is_archived = 1 WHERE id = ?').run(todoId);
    return result.changes > 0;
  }

  /**
   * Updates mutable fields on a todo record.
   * @param todoId The todo's UUID.
   * @param updates Partial update with title, description, and/or status.
   * @returns The updated TodoDto, or null if not found.
   */
  updateTodo(
    todoId: string,
    updates: Partial<Pick<Todo, 'title' | 'description' | 'status'>>,
  ): TodoDto | null {
    const existing = this.db
      .query<TodoRow, [string]>('SELECT * FROM todos WHERE id = ?')
      .get(todoId);
    if (!existing) return null;

    const title = updates.title ?? existing.title;
    const description = updates.description ?? existing.description;
    const status = updates.status ?? existing.status;
    const now = Date.now();

    this.db
      .query('UPDATE todos SET title = ?, description = ?, status = ?, updated_at = ? WHERE id = ?')
      .run(title, description, status, now, todoId);

    const updated = this.db
      .query<TodoRow, [string]>('SELECT * FROM todos WHERE id = ?')
      .get(todoId)!;
    return this.rowToTodoDto(updated);
  }

  /**
   * Inserts a migration audit record.
   * @param summary Human-readable summary of what was migrated.
   * @returns The created MigrationRecord.
   */
  insertMigration(summary: string): MigrationRecord {
    const id = crypto.randomUUID();
    const now = Date.now();
    this.db
      .query('INSERT INTO migrations (id, summary, created_at) VALUES (?, ?, ?)')
      .run(id, summary, now);
    return { id, summary, createdAt: now };
  }

  /** Closes the database connection. */
  close(): void {
    this.db.close();
  }

  /**
   * Reads a setting value by key.
   * @param key The setting key.
   * @returns The stored string value, or null if not set.
   */
  getSetting(key: string): string | null {
    const row = this.db
      .query<{ value: string }, [string]>('SELECT value FROM settings WHERE key = ?')
      .get(key);
    return row?.value ?? null;
  }

  /**
   * Persists a setting value.
   * @param key The setting key.
   * @param value The value to store.
   */
  setSetting(key: string, value: string): void {
    this.db.query('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
  }

  /**
   * Maps a raw SQLite TodoRow to the domain Todo entity.
   * @param row Raw database row.
   * @returns Todo entity.
   */
  private rowToTodo(row: TodoRow): Todo {
    return {
      id: row.id,
      projectId: row.project_id,
      externalId: row.external_id,
      title: row.title,
      description: row.description,
      status: row.status,
      isArchived: row.is_archived === 1,
      sessionIds: JSON.parse(row.session_ids ?? '[]') as string[],
      sourceMetadata: JSON.parse(row.source_metadata ?? '{}') as Record<string, unknown>,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Maps a raw SQLite TodoRow to the TodoDto transport object.
   * @param row Raw database row.
   * @returns TodoDto object.
   */
  private rowToTodoDto(row: TodoRow): TodoDto {
    return {
      id: row.id,
      projectId: row.project_id,
      externalId: row.external_id,
      title: row.title,
      description: row.description,
      status: row.status,
      isArchived: row.is_archived === 1,
      sessionIds: JSON.parse(row.session_ids ?? '[]') as string[],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
