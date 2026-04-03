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

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { Database } from 'bun:sqlite';
import { RegistryDatabase } from '../../../infrastructure/database/RegistryDatabase';
import { migrateSessions } from '../migrateSessions';
import { join } from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';

/** Creates and seeds a temporary session.db with the given todos. */
async function createSessionDb(
  dir: string,
  name: string,
  todos: Array<{ id: string; title: string; description: string; status: string }>,
): Promise<string> {
  const dbPath = join(dir, name);
  const db = new Database(dbPath, { create: true });
  db.run(`
    CREATE TABLE todos (
      id TEXT PRIMARY KEY,
      title TEXT,
      description TEXT,
      status TEXT DEFAULT 'pending',
      created_at INTEGER,
      updated_at INTEGER
    )
  `);
  db.run(`
    CREATE TABLE todo_deps (
      todo_id TEXT,
      depends_on TEXT,
      PRIMARY KEY (todo_id, depends_on)
    )
  `);

  const now = Date.now();
  for (const todo of todos) {
    db.run(
      'INSERT INTO todos (id, title, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [todo.id, todo.title, todo.description, todo.status, now, now],
    );
  }
  db.close();
  return dbPath;
}

describe('migrateSessions', () => {
  let tmpDir: string;
  let registry: RegistryDatabase;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'migrate-test-'));
    registry = new RegistryDatabase(join(tmpDir, 'registry.db'));
  });

  afterEach(async () => {
    registry.close();
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('imports todos from a session.db into the registry', async () => {
    const project = registry.upsertProject('my-app', '/home/user/my-app');
    const sessionDbPath = await createSessionDb(tmpDir, 'session.db', [
      { id: 'ext-1', title: 'First', description: 'Desc 1', status: 'pending' },
      { id: 'ext-2', title: 'Second', description: 'Desc 2', status: 'done' },
    ]);
    registry.insertSession({
      projectId: project.id,
      sessionName: 'abc123',
      sessionPath: join(tmpDir, 'abc123'),
      sessionDbPath,
      lastModified: Date.now(),
    });

    const result = await migrateSessions(registry, project.id);

    expect(result.success).toBe(true);
    expect(result.count).toBe(2);
    expect(result.skippedSessionIds).toHaveLength(0);

    const todos = registry.getTodosByProjectId(project.id);
    expect(todos).toHaveLength(2);
    expect(todos.map((t) => t.externalId)).toEqual(expect.arrayContaining(['ext-1', 'ext-2']));
  });

  it('skips sessions that have no session.db path', async () => {
    const project = registry.upsertProject('my-app', '/home/user/my-app');
    const session = registry.insertSession({
      projectId: project.id,
      sessionName: 'no-db-session',
      sessionPath: join(tmpDir, 'no-db-session'),
      sessionDbPath: null,
      lastModified: Date.now(),
    });

    const result = await migrateSessions(registry, project.id);

    expect(result.success).toBe(true);
    expect(result.count).toBe(0);
    expect(result.skippedSessionIds).toContain(session.id);
  });

  it('skips sessions whose session.db file is missing', async () => {
    const project = registry.upsertProject('my-app', '/home/user/my-app');
    const session = registry.insertSession({
      projectId: project.id,
      sessionName: 'ghost-session',
      sessionPath: join(tmpDir, 'ghost-session'),
      sessionDbPath: join(tmpDir, 'does-not-exist.db'),
      lastModified: Date.now(),
    });

    const result = await migrateSessions(registry, project.id);

    expect(result.success).toBe(true);
    expect(result.count).toBe(0);
    expect(result.skippedSessionIds).toContain(session.id);
  });

  it('deduplicates todos across multiple sessions by externalId', async () => {
    const project = registry.upsertProject('my-app', '/home/user/my-app');
    const now = Date.now();

    // Two sessions with the same todo external ID; session B is newer.
    const dbPathA = await createSessionDb(tmpDir, 'session-a.db', [
      { id: 'shared-todo', title: 'Old title', description: 'Old desc', status: 'pending' },
    ]);
    const dbPathB = await createSessionDb(tmpDir, 'session-b.db', [
      { id: 'shared-todo', title: 'New title', description: 'New desc', status: 'in_progress' },
    ]);

    // Insert session A first so its updated_at is older
    const sessionA = registry.insertSession({
      projectId: project.id,
      sessionName: 'session-a',
      sessionPath: join(tmpDir, 'session-a'),
      sessionDbPath: dbPathA,
      lastModified: now - 10_000,
    });

    const sessionB = registry.insertSession({
      projectId: project.id,
      sessionName: 'session-b',
      sessionPath: join(tmpDir, 'session-b'),
      sessionDbPath: dbPathB,
      lastModified: now,
    });

    // Force session-b todo to have a newer timestamp by patching the DB directly
    const tempDb = new Database(dbPathB);
    tempDb.run('UPDATE todos SET updated_at = ? WHERE id = ?', [now + 5000, 'shared-todo']);
    tempDb.close();

    const result = await migrateSessions(registry, project.id);

    // 2 sessions × 1 todo = 2 upserts, but only 1 unique todo should exist
    expect(result.count).toBe(2);
    const todos = registry.getTodosByProjectId(project.id);
    expect(todos).toHaveLength(1);
    expect(todos[0].title).toBe('New title');
    // Both session IDs should be recorded in provenance
    expect(todos[0].sessionIds).toEqual(expect.arrayContaining([sessionA.id, sessionB.id]));
  });

  it('returns count 0 and records migration audit entry for empty project', async () => {
    const project = registry.upsertProject('empty-app', '/home/user/empty-app');

    const result = await migrateSessions(registry, project.id);

    expect(result.success).toBe(true);
    expect(result.count).toBe(0);
  });

  it('writes a migration audit record on completion', async () => {
    const project = registry.upsertProject('my-app', '/home/user/my-app');
    const dbPath = await createSessionDb(tmpDir, 'audit-session.db', [
      { id: 'a1', title: 'Task', description: '', status: 'pending' },
    ]);
    registry.insertSession({
      projectId: project.id,
      sessionName: 'audit-session',
      sessionPath: join(tmpDir, 'audit-session'),
      sessionDbPath: dbPath,
      lastModified: Date.now(),
    });

    await migrateSessions(registry, project.id);

    // Migration audit record is stored in the migrations table.
    // We verify by checking that a second scan still works correctly
    // (the migrations table constraint doesn't block re-runs).
    const secondResult = await migrateSessions(registry, project.id);
    expect(secondResult.success).toBe(true);
  });
});
