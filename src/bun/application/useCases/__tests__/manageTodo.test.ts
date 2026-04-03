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
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { RegistryDatabase } from '../../../infrastructure/database/RegistryDatabase';
import { addTodo, updateTodo, archiveTodo } from '../manageTodo';

describe('manageTodo', () => {
  let tmpDir: string;
  let db: RegistryDatabase;
  let projectId: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'manage-todo-test-'));
    db = new RegistryDatabase(join(tmpDir, 'test.db'));
    projectId = db.upsertProject('test-project', '/home/user/test-project').id;
  });

  afterEach(async () => {
    db.close();
    await rm(tmpDir, { recursive: true });
  });

  describe('addTodo', () => {
    test('creates a new todo and returns a DTO', () => {
      const dto = addTodo(db, projectId, 'Write tests', 'All the tests', 'pending');

      expect(dto.id).toBeTruthy();
      expect(dto.projectId).toBe(projectId);
      expect(dto.title).toBe('Write tests');
      expect(dto.description).toBe('All the tests');
      expect(dto.status).toBe('pending');
      expect(dto.isArchived).toBe(false);
      expect(dto.sessionIds).toEqual([]);
      expect(dto.externalId).toBeNull();
    });

    test('sets createdAt and updatedAt close to now', () => {
      const before = Date.now();
      const dto = addTodo(db, projectId, 'Task', '', 'pending');
      const after = Date.now();

      expect(dto.createdAt).toBeGreaterThanOrEqual(before);
      expect(dto.createdAt).toBeLessThanOrEqual(after);
      expect(dto.updatedAt).toBeGreaterThanOrEqual(before);
    });

    test('two separate addTodo calls produce distinct IDs', () => {
      const first = addTodo(db, projectId, 'First', '', 'pending');
      const second = addTodo(db, projectId, 'Second', '', 'pending');
      expect(first.id).not.toBe(second.id);
    });
  });

  describe('updateTodo', () => {
    test('returns updated DTO with new field values', () => {
      const original = addTodo(db, projectId, 'Old title', 'Old desc', 'pending');
      const updated = updateTodo(db, original.id, { title: 'New title', status: 'done' });

      expect(updated?.title).toBe('New title');
      expect(updated?.status).toBe('done');
      expect(updated?.description).toBe('Old desc');
    });

    test('returns null for a non-existent todo ID', () => {
      expect(updateTodo(db, 'does-not-exist', { title: 'x' })).toBeNull();
    });

    test('partial update only changes specified fields', () => {
      const original = addTodo(db, projectId, 'Title', 'Desc', 'pending');
      const updated = updateTodo(db, original.id, { status: 'in_progress' });

      expect(updated?.title).toBe('Title');
      expect(updated?.description).toBe('Desc');
      expect(updated?.status).toBe('in_progress');
    });
  });

  describe('archiveTodo', () => {
    test('returns true and removes todo from active list', () => {
      const dto = addTodo(db, projectId, 'To archive', '', 'pending');
      const result = archiveTodo(db, dto.id);

      expect(result).toBe(true);
      const remaining = db.getTodosByProjectId(projectId);
      expect(remaining.find((t) => t.id === dto.id)).toBeUndefined();
    });

    test('returns false for a non-existent todo ID', () => {
      expect(archiveTodo(db, 'does-not-exist')).toBe(false);
    });
  });
});
