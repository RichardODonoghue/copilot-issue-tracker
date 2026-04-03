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

import { expect, test, describe } from 'bun:test';
import { join } from 'node:path';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { WorkspaceYamlParser } from '../WorkspaceYamlParser';

describe('WorkspaceYamlParser', () => {
  test('parses a valid workspace.yaml with a cwd property', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'wsp-test-'));
    const filePath = join(dir, 'workspace.yaml');
    await writeFile(filePath, 'cwd: /home/user/myproject\nother: value\n');

    const result = await WorkspaceYamlParser.parse(filePath);

    expect(result).not.toBeNull();
    expect(result?.cwd).toBe('/home/user/myproject');

    await rm(dir, { recursive: true });
  });

  test('parses workspace.yaml with quoted cwd value', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'wsp-test-'));
    const filePath = join(dir, 'workspace.yaml');
    await writeFile(filePath, 'cwd: "/home/user/my project"\n');

    const result = await WorkspaceYamlParser.parse(filePath);

    expect(result?.cwd).toBe('/home/user/my project');

    await rm(dir, { recursive: true });
  });

  test('returns null for a missing file', async () => {
    const result = await WorkspaceYamlParser.parse('/nonexistent/workspace.yaml');
    expect(result).toBeNull();
  });

  test('returns null for a YAML file missing the cwd key', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'wsp-test-'));
    const filePath = join(dir, 'workspace.yaml');
    await writeFile(filePath, 'name: myproject\nversion: 1\n');

    const result = await WorkspaceYamlParser.parse(filePath);

    expect(result).toBeNull();

    await rm(dir, { recursive: true });
  });

  test('returns null for an empty file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'wsp-test-'));
    const filePath = join(dir, 'workspace.yaml');
    await writeFile(filePath, '');

    const result = await WorkspaceYamlParser.parse(filePath);

    expect(result).toBeNull();

    await rm(dir, { recursive: true });
  });
});
