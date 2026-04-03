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
import { RegistryDatabase } from '../RegistryDatabase';

describe('RegistryDatabase', () => {
  let tmpDir: string;
  let db: RegistryDatabase;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'registry-test-'));
    db = new RegistryDatabase(join(tmpDir, 'test.db'));
  });

  afterEach(async () => {
    db.close();
    await rm(tmpDir, { recursive: true });
  });

  describe('upsertProject', () => {
    test('creates a new project', () => {
      const project = db.upsertProject('myproject', '/home/user/myproject');

      expect(project.id).toBeTruthy();
      expect(project.name).toBe('myproject');
      expect(project.cwd).toBe('/home/user/myproject');
      expect(project.createdAt).toBeGreaterThan(0);
    });

    test('returns existing project on second call with same cwd', () => {
      const first = db.upsertProject('myproject', '/home/user/myproject');
      const second = db.upsertProject('myproject-renamed', '/home/user/myproject');

      expect(second.id).toBe(first.id);
      expect(second.name).toBe('myproject-renamed');
    });
  });

  describe('getProjects', () => {
    test('returns empty array when no projects exist', () => {
      expect(db.getProjects()).toEqual([]);
    });

    test('returns all projects with aggregated counts', () => {
      db.upsertProject('proj-a', '/home/user/proj-a');
      db.upsertProject('proj-b', '/home/user/proj-b');

      const projects = db.getProjects();
      expect(projects).toHaveLength(2);
      expect(projects.every((p) => typeof p.sessionCount === 'number')).toBe(true);
    });
  });

  describe('insertSession', () => {
    test('creates a new session linked to a project', () => {
      const project = db.upsertProject('proj', '/home/user/proj');
      const session = db.insertSession({
        projectId: project.id,
        sessionName: 'session-abc',
        sessionPath: '/path/to/session-abc',
        sessionDbPath: null,
        lastModified: Date.now(),
      });

      expect(session.id).toBeTruthy();
      expect(session.projectId).toBe(project.id);
      expect(session.sessionName).toBe('session-abc');
    });

    test('updates lastModified on second insert with same sessionPath', () => {
      const project = db.upsertProject('proj', '/home/user/proj');
      const path = '/path/to/session-abc';

      const first = db.insertSession({
        projectId: project.id,
        sessionName: 'session-abc',
        sessionPath: path,
        sessionDbPath: null,
        lastModified: 1000,
      });

      const second = db.insertSession({
        projectId: project.id,
        sessionName: 'session-abc',
        sessionPath: path,
        sessionDbPath: '/path/to/session.db',
        lastModified: 2000,
      });

      expect(second.id).toBe(first.id);
      expect(second.lastModified).toBe(2000);
      expect(second.sessionDbPath).toBe('/path/to/session.db');
    });
  });

  describe('upsertTodo', () => {
    test('creates a new todo', () => {
      const project = db.upsertProject('proj', '/home/user/proj');
      const now = Date.now();

      const todo = db.upsertTodo({
        projectId: project.id,
        externalId: 'ext-1',
        title: 'Test todo',
        description: 'Description',
        status: 'pending',
        isArchived: false,
        sessionIds: ['session-1'],
        sourceMetadata: {},
        createdAt: now,
        updatedAt: now,
      });

      expect(todo.id).toBeTruthy();
      expect(todo.title).toBe('Test todo');
      expect(todo.externalId).toBe('ext-1');
    });

    test('deduplicates by externalId and keeps newer updatedAt', () => {
      const project = db.upsertProject('proj', '/home/user/proj');
      const earlier = Date.now() - 10000;
      const later = Date.now();

      db.upsertTodo({
        projectId: project.id,
        externalId: 'ext-1',
        title: 'Original title',
        description: '',
        status: 'pending',
        isArchived: false,
        sessionIds: ['session-1'],
        sourceMetadata: {},
        createdAt: earlier,
        updatedAt: earlier,
      });

      const second = db.upsertTodo({
        projectId: project.id,
        externalId: 'ext-1',
        title: 'Updated title',
        description: '',
        status: 'in_progress',
        isArchived: false,
        sessionIds: ['session-2'],
        sourceMetadata: {},
        createdAt: earlier,
        updatedAt: later,
      });

      expect(second.title).toBe('Updated title');
      expect(second.sessionIds).toContain('session-1');
      expect(second.sessionIds).toContain('session-2');
    });
  });

  describe('archiveTodo', () => {
    test('archives a todo and excludes it from getTodosByProjectId', () => {
      const project = db.upsertProject('proj', '/home/user/proj');
      const now = Date.now();
      const todo = db.upsertTodo({
        projectId: project.id,
        externalId: null,
        title: 'To archive',
        description: '',
        status: 'pending',
        isArchived: false,
        sessionIds: [],
        sourceMetadata: {},
        createdAt: now,
        updatedAt: now,
      });

      expect(db.archiveTodo(todo.id)).toBe(true);
      const todos = db.getTodosByProjectId(project.id);
      expect(todos.find((t) => t.id === todo.id)).toBeUndefined();
    });
  });

  describe('updateTodo', () => {
    test('updates title, description and status', () => {
      const project = db.upsertProject('proj', '/home/user/proj');
      const now = Date.now();
      const todo = db.upsertTodo({
        projectId: project.id,
        externalId: null,
        title: 'Old title',
        description: 'Old desc',
        status: 'pending',
        isArchived: false,
        sessionIds: [],
        sourceMetadata: {},
        createdAt: now,
        updatedAt: now,
      });

      const updated = db.updateTodo(todo.id, {
        title: 'New title',
        status: 'done',
      });

      expect(updated?.title).toBe('New title');
      expect(updated?.status).toBe('done');
      expect(updated?.description).toBe('Old desc');
    });

    test('returns null for unknown todoId', () => {
      const result = db.updateTodo('nonexistent-id', { title: 'X' });
      expect(result).toBeNull();
    });
  });

  describe('getSetting / setSetting', () => {
    test('returns null for an unset key', () => {
      expect(db.getSetting('copilotPath')).toBeNull();
    });

    test('persists and retrieves a value', () => {
      db.setSetting('copilotPath', '/custom/path');
      expect(db.getSetting('copilotPath')).toBe('/custom/path');
    });

    test('overwrites an existing value', () => {
      db.setSetting('copilotPath', '/old/path');
      db.setSetting('copilotPath', '/new/path');
      expect(db.getSetting('copilotPath')).toBe('/new/path');
    });
  });

  describe('getSessionsByProjectId', () => {
    test('returns sessions sorted newest first', () => {
      const project = db.upsertProject('proj', '/home/user/proj');
      db.insertSession({
        projectId: project.id,
        sessionName: 'old-session',
        sessionPath: '/path/old',
        sessionDbPath: null,
        lastModified: 1000,
      });
      db.insertSession({
        projectId: project.id,
        sessionName: 'new-session',
        sessionPath: '/path/new',
        sessionDbPath: null,
        lastModified: 5000,
      });

      const sessions = db.getSessionsByProjectId(project.id);
      expect(sessions[0].sessionName).toBe('new-session');
      expect(sessions[1].sessionName).toBe('old-session');
    });
  });
});
