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

import { expect, test, describe, beforeEach, afterEach } from 'bun:test';
import { join } from 'node:path';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { Database } from 'bun:sqlite';
import { RegistryDatabase } from '../../../infrastructure/database/RegistryDatabase';
import { scanAndSyncSessions } from '../scanAndSyncSessions';

/**
 * Creates a minimal session folder with workspace.yaml and optional session.db.
 * @param sessionStateDir Root session-state directory.
 * @param sessionName Folder name for this session.
 * @param cwd The cwd path written into workspace.yaml.
 * @param todos Optional array of todos to seed into session.db.
 */
async function createSession(
  sessionStateDir: string,
  sessionName: string,
  cwd: string,
  todos: Array<{ id: string; title: string; status: string }> = [],
): Promise<void> {
  const sessionDir = join(sessionStateDir, sessionName);
  await mkdir(sessionDir, { recursive: true });
  await writeFile(join(sessionDir, 'workspace.yaml'), `cwd: ${cwd}\n`);

  if (todos.length > 0) {
    const dbPath = join(sessionDir, 'session.db');
    const db = new Database(dbPath);
    db.run(`CREATE TABLE todos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`);
    const now = Date.now();
    for (const todo of todos) {
      db.run(
        `INSERT INTO todos (id, title, description, status, created_at, updated_at)
         VALUES (?, ?, '', ?, ?, ?)`,
        [todo.id, todo.title, todo.status, now, now],
      );
    }
    db.close();
  }
}

describe('scanAndSyncSessions', () => {
  let tmpDir: string;
  let sessionStateDir: string;
  let db: RegistryDatabase;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'scan-sync-test-'));
    sessionStateDir = join(tmpDir, 'session-state');
    await mkdir(sessionStateDir, { recursive: true });
    db = new RegistryDatabase(join(tmpDir, 'registry.db'));
  });

  afterEach(async () => {
    db.close();
    await rm(tmpDir, { recursive: true });
  });

  test('returns zero counts when the session-state directory is empty', async () => {
    const result = await scanAndSyncSessions(db, sessionStateDir);
    expect(result.projectCount).toBe(0);
    expect(result.sessionCount).toBe(0);
  });

  test('returns zero counts when the directory does not exist', async () => {
    const result = await scanAndSyncSessions(db, join(tmpDir, 'nonexistent'));
    expect(result.projectCount).toBe(0);
    expect(result.sessionCount).toBe(0);
  });

  test('creates a project and session for a single valid session folder', async () => {
    await createSession(sessionStateDir, 'session-abc', '/home/user/my-project');

    const result = await scanAndSyncSessions(db, sessionStateDir);

    expect(result.projectCount).toBe(1);
    expect(result.sessionCount).toBe(1);

    const projects = db.getProjects();
    expect(projects).toHaveLength(1);
    expect(projects[0].name).toBe('my-project');
  });

  test('groups multiple sessions sharing the same cwd under one project', async () => {
    await createSession(sessionStateDir, 'session-1', '/home/user/shared-project');
    await createSession(sessionStateDir, 'session-2', '/home/user/shared-project');

    const result = await scanAndSyncSessions(db, sessionStateDir);

    expect(result.projectCount).toBe(1);
    expect(result.sessionCount).toBe(2);
    expect(db.getProjects()).toHaveLength(1);
  });

  test('creates separate projects for different cwd values', async () => {
    await createSession(sessionStateDir, 'session-a', '/home/user/project-a');
    await createSession(sessionStateDir, 'session-b', '/home/user/project-b');

    const result = await scanAndSyncSessions(db, sessionStateDir);

    expect(result.projectCount).toBe(2);
    expect(result.sessionCount).toBe(2);
    expect(db.getProjects()).toHaveLength(2);
  });

  test('imports todos from session.db into the registry', async () => {
    await createSession(sessionStateDir, 'session-with-todos', '/home/user/project-x', [
      { id: 'todo-1', title: 'Fix bug', status: 'pending' },
      { id: 'todo-2', title: 'Write docs', status: 'done' },
    ]);

    await scanAndSyncSessions(db, sessionStateDir);

    const projects = db.getProjects();
    const todos = db.getTodosByProjectId(projects[0].id);
    expect(todos).toHaveLength(2);
    expect(todos.map((t) => t.title).sort()).toEqual(['Fix bug', 'Write docs']);
  });

  test('deduplicates todos across re-scans via externalId', async () => {
    await createSession(sessionStateDir, 'session-dup', '/home/user/dup-project', [
      { id: 'todo-stable', title: 'Stable task', status: 'pending' },
    ]);

    // Scan twice — the todo should appear only once.
    await scanAndSyncSessions(db, sessionStateDir);
    await scanAndSyncSessions(db, sessionStateDir);

    const projects = db.getProjects();
    const todos = db.getTodosByProjectId(projects[0].id);
    expect(todos).toHaveLength(1);
  });

  test('skips session folders with no session.db gracefully', async () => {
    // No todos argument → no session.db created
    await createSession(sessionStateDir, 'session-no-db', '/home/user/no-db-project');

    const result = await scanAndSyncSessions(db, sessionStateDir);

    expect(result.sessionCount).toBe(1);
    const projects = db.getProjects();
    expect(projects).toHaveLength(1);
  });
});
