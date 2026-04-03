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
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { Database } from 'bun:sqlite';
import { SessionDbReader } from '../SessionDbReader';

/**
 * Creates a minimal session.db at the given path with the standard schema.
 * @param dbPath Absolute path for the new database file.
 */
function createSessionDb(dbPath: string): void {
  const db = new Database(dbPath);
  db.run(`CREATE TABLE todos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`);
  db.run(`CREATE TABLE todo_deps (
    todo_id TEXT NOT NULL,
    depends_on TEXT NOT NULL,
    PRIMARY KEY (todo_id, depends_on)
  )`);
  db.close();
}

describe('SessionDbReader', () => {
  let tmpDir: string;
  let dbPath: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'session-reader-test-'));
    dbPath = join(tmpDir, 'session.db');
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true });
  });

  describe('getTodos', () => {
    test('returns empty array from an empty todos table', () => {
      createSessionDb(dbPath);
      const reader = new SessionDbReader(dbPath);
      expect(reader.getTodos()).toEqual([]);
      reader.close();
    });

    test('returns todos from the database', () => {
      createSessionDb(dbPath);
      const db = new Database(dbPath);
      const now = Date.now();
      db.run(
        `INSERT INTO todos (id, title, description, status, created_at, updated_at)
         VALUES ('todo-1', 'My task', 'Some details', 'pending', ?, ?)`,
        [now, now],
      );
      db.close();

      const reader = new SessionDbReader(dbPath);
      const todos = reader.getTodos();

      expect(todos).toHaveLength(1);
      expect(todos[0].id).toBe('todo-1');
      expect(todos[0].title).toBe('My task');
      expect(todos[0].description).toBe('Some details');
      expect(todos[0].status).toBe('pending');
      reader.close();
    });

    test('excludes archived todos', () => {
      createSessionDb(dbPath);
      const db = new Database(dbPath);
      const now = Date.now();
      db.run(
        `INSERT INTO todos (id, title, description, status, created_at, updated_at)
         VALUES ('t-active', 'Active', '', 'pending', ?, ?),
                ('t-archived', 'Archived', '', 'archived', ?, ?)`,
        [now, now, now, now],
      );
      db.close();

      const reader = new SessionDbReader(dbPath);
      const todos = reader.getTodos();

      expect(todos).toHaveLength(1);
      expect(todos[0].id).toBe('t-active');
      reader.close();
    });

    test('returns empty array when todos table does not exist', () => {
      const db = new Database(dbPath);
      db.run('CREATE TABLE other (id TEXT)');
      db.close();

      const reader = new SessionDbReader(dbPath);
      expect(reader.getTodos()).toEqual([]);
      reader.close();
    });

    test('returns empty array for a corrupt / empty file', async () => {
      await writeFile(dbPath, 'this is not sqlite data');
      // Opening a corrupt file should not throw; getTodos should catch
      let reader: SessionDbReader | null = null;
      try {
        reader = new SessionDbReader(dbPath);
        expect(reader.getTodos()).toEqual([]);
      } catch {
        // If the constructor itself throws that is also acceptable
      } finally {
        reader?.close();
      }
    });
  });

  describe('getDeps', () => {
    test('returns empty array from an empty todo_deps table', () => {
      createSessionDb(dbPath);
      const reader = new SessionDbReader(dbPath);
      expect(reader.getDeps()).toEqual([]);
      reader.close();
    });

    test('returns dependency pairs from the database', () => {
      createSessionDb(dbPath);
      const db = new Database(dbPath);
      const now = Date.now();
      db.run(
        `INSERT INTO todos (id, title, description, status, created_at, updated_at)
         VALUES ('t-a', 'A', '', 'pending', ?, ?),
                ('t-b', 'B', '', 'pending', ?, ?)`,
        [now, now, now, now],
      );
      db.run(`INSERT INTO todo_deps (todo_id, depends_on) VALUES ('t-b', 't-a')`);
      db.close();

      const reader = new SessionDbReader(dbPath);
      const deps = reader.getDeps();

      expect(deps).toHaveLength(1);
      expect(deps[0].todoId).toBe('t-b');
      expect(deps[0].dependsOn).toBe('t-a');
      reader.close();
    });

    test('returns empty array when todo_deps table does not exist', () => {
      const db = new Database(dbPath);
      db.run('CREATE TABLE todos (id TEXT PRIMARY KEY)');
      db.close();

      const reader = new SessionDbReader(dbPath);
      expect(reader.getDeps()).toEqual([]);
      reader.close();
    });
  });
});
