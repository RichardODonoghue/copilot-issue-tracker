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

import { readdir, stat } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { WorkspaceYamlParser } from './WorkspaceYamlParser';

/**
 * Represents a discovered Copilot session directory with all metadata
 * needed to register it in the local registry.
 */
export interface ScannedSession {
  sessionName: string;
  sessionPath: string;
  sessionDbPath: string | null;
  projectName: string;
  cwd: string;
  lastModified: number;
}

/**
 * Scans a Copilot session-state directory to discover active sessions
 * and their associated workspace configurations.
 */
export class SessionScanner {
  private readonly copilotStatePath: string;

  /**
   * @param copilotStatePath Absolute path to ~/.copilot/session-state
   */
  constructor(copilotStatePath: string) {
    this.copilotStatePath = copilotStatePath;
  }

  /**
   * Reads all subdirectories under the copilot state path, parses each
   * workspace.yaml, and checks for a session.db file.
   * @returns Array of discovered sessions with metadata.
   */
  async scan(): Promise<ScannedSession[]> {
    let entries: string[];
    try {
      entries = await readdir(this.copilotStatePath);
    } catch {
      // Directory doesn't exist or is inaccessible
      return [];
    }

    const results: ScannedSession[] = [];

    for (const entry of entries) {
      const sessionPath = join(this.copilotStatePath, entry);

      let dirStat;
      try {
        dirStat = await stat(sessionPath);
      } catch {
        continue;
      }

      if (!dirStat.isDirectory()) continue;

      const workspaceYamlPath = join(sessionPath, 'workspace.yaml');
      const parsed = await WorkspaceYamlParser.parse(workspaceYamlPath);
      if (!parsed) continue;

      const sessionDbPath = join(sessionPath, 'session.db');
      let hasDb = false;
      try {
        const dbStat = await stat(sessionDbPath);
        hasDb = dbStat.isFile();
      } catch {
        hasDb = false;
      }

      results.push({
        sessionName: entry,
        sessionPath,
        sessionDbPath: hasDb ? sessionDbPath : null,
        projectName: basename(parsed.cwd),
        cwd: parsed.cwd,
        lastModified: dirStat.mtimeMs,
      });
    }

    return results;
  }
}
