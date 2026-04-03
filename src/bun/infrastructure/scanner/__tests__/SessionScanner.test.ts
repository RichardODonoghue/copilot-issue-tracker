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
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { SessionScanner } from '../SessionScanner';

describe('SessionScanner', () => {
  let baseDir: string;

  beforeEach(async () => {
    baseDir = await mkdtemp(join(tmpdir(), 'scanner-test-'));
  });

  afterEach(async () => {
    await rm(baseDir, { recursive: true });
  });

  /**
   * Creates a mock session directory with a workspace.yaml.
   * @param name Session directory name.
   * @param cwd The cwd value to write in workspace.yaml.
   * @param includeDb Whether to create a session.db file.
   */
  async function createMockSession(name: string, cwd: string, includeDb = false): Promise<void> {
    const sessionDir = join(baseDir, name);
    await mkdir(sessionDir, { recursive: true });
    await writeFile(join(sessionDir, 'workspace.yaml'), `cwd: ${cwd}\n`);
    if (includeDb) {
      await writeFile(join(sessionDir, 'session.db'), '');
    }
  }

  test('returns empty array when directory does not exist', async () => {
    const scanner = new SessionScanner('/nonexistent/path');
    const results = await scanner.scan();
    expect(results).toEqual([]);
  });

  test('returns empty array when directory has no valid sessions', async () => {
    const scanner = new SessionScanner(baseDir);
    const results = await scanner.scan();
    expect(results).toEqual([]);
  });

  test('discovers a single session with workspace.yaml', async () => {
    await createMockSession('session-abc', '/home/user/myproject');
    const scanner = new SessionScanner(baseDir);
    const results = await scanner.scan();

    expect(results).toHaveLength(1);
    expect(results[0].sessionName).toBe('session-abc');
    expect(results[0].cwd).toBe('/home/user/myproject');
    expect(results[0].projectName).toBe('myproject');
    expect(results[0].sessionDbPath).toBeNull();
  });

  test('detects session.db when present', async () => {
    await createMockSession('session-xyz', '/home/user/anotherproject', true);
    const scanner = new SessionScanner(baseDir);
    const results = await scanner.scan();

    expect(results).toHaveLength(1);
    expect(results[0].sessionDbPath).not.toBeNull();
    expect(results[0].sessionDbPath).toContain('session.db');
  });

  test('discovers multiple sessions', async () => {
    await createMockSession('session-1', '/home/user/proj-a');
    await createMockSession('session-2', '/home/user/proj-b', true);
    await createMockSession('session-3', '/home/user/proj-a');

    const scanner = new SessionScanner(baseDir);
    const results = await scanner.scan();

    expect(results).toHaveLength(3);
    const names = results.map((r) => r.sessionName).sort();
    expect(names).toEqual(['session-1', 'session-2', 'session-3']);
  });

  test('ignores directories without workspace.yaml', async () => {
    const emptyDir = join(baseDir, 'no-yaml-session');
    await mkdir(emptyDir, { recursive: true });
    await createMockSession('valid-session', '/home/user/valid');

    const scanner = new SessionScanner(baseDir);
    const results = await scanner.scan();

    expect(results).toHaveLength(1);
    expect(results[0].sessionName).toBe('valid-session');
  });
});
