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

import { SessionScanner } from '../../infrastructure/scanner/SessionScanner';
import { SessionDbReader } from '../../infrastructure/sessionReader/SessionDbReader';
import type { RegistryDatabase } from '../../infrastructure/database/RegistryDatabase';

/**
 * Scans all Copilot sessions under the given path and synchronises them
 * into the local registry database.
 *
 * Algorithm:
 * 1. Discover session directories and parse workspace.yaml for each.
 * 2. Upsert a Project record keyed on cwd.
 * 3. Upsert a Session record linking the session directory to the project.
 * 4. If a session.db is present, read its todos and merge them into the
 *    registry using external_id + project_id as the deduplication key,
 *    keeping the newest updated_at when a conflict occurs.
 *
 * @param db Open RegistryDatabase instance to write into.
 * @param copilotPath Absolute path to ~/.copilot/session-state.
 * @returns Counts of projects and sessions processed.
 */
export async function scanAndSyncSessions(
  db: RegistryDatabase,
  copilotPath: string,
): Promise<{ projectCount: number; sessionCount: number }> {
  const scanner = new SessionScanner(copilotPath);
  const scannedSessions = await scanner.scan();

  const projectIds = new Set<string>();

  for (const scanned of scannedSessions) {
    // 1. Upsert project
    const project = db.upsertProject(scanned.projectName, scanned.cwd);
    projectIds.add(project.id);

    // 2. Upsert session
    const session = db.insertSession({
      projectId: project.id,
      sessionName: scanned.sessionName,
      sessionPath: scanned.sessionPath,
      sessionDbPath: scanned.sessionDbPath,
      lastModified: scanned.lastModified,
    });

    // 3. Merge todos from session.db if available
    if (scanned.sessionDbPath) {
      let reader: SessionDbReader | null = null;
      try {
        reader = new SessionDbReader(scanned.sessionDbPath);
        const todos = reader.getTodos();

        for (const sessionTodo of todos) {
          db.upsertTodo({
            projectId: project.id,
            externalId: sessionTodo.id,
            title: sessionTodo.title,
            description: sessionTodo.description,
            status: sessionTodo.status,
            isArchived: false,
            sessionIds: [session.id],
            sourceMetadata: {},
            createdAt: sessionTodo.createdAt,
            updatedAt: sessionTodo.updatedAt,
          });
        }
      } catch {
        // Skip unreadable session databases
      } finally {
        reader?.close();
      }
    }
  }

  db.insertMigration(
    `Scanned ${scannedSessions.length} sessions across ${projectIds.size} projects`,
  );

  return {
    projectCount: projectIds.size,
    sessionCount: scannedSessions.length,
  };
}
