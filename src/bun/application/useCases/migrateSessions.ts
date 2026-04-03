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

import type { RegistryDatabase } from '../../infrastructure/database/RegistryDatabase';
import { SessionDbReader } from '../../infrastructure/sessionReader/SessionDbReader';

/**
 * Result returned from a session migration operation.
 */
export interface MigrateSessionsResult {
  /** Whether the operation completed without a top-level error. */
  success: boolean;
  /** Number of todo records imported or updated during the migration. */
  count: number;
  /** Session IDs that were skipped due to errors or missing db files. */
  skippedSessionIds: string[];
}

/**
 * Migrates todos from all session.db files belonging to a project into the
 * local registry. Todos are merged using the same deduplication strategy as
 * the initial scan (external_id + project_id key; newest updated_at wins).
 *
 * A migration audit record is written to the migrations table on success.
 *
 * @param db Open RegistryDatabase instance to write into.
 * @param projectId UUID of the project whose sessions should be migrated.
 * @returns MigrateSessionsResult with counts and any skipped session IDs.
 */
export async function migrateSessions(
  db: RegistryDatabase,
  projectId: string,
): Promise<MigrateSessionsResult> {
  const sessions = db.getSessionsByProjectId(projectId);
  let count = 0;
  const skippedSessionIds: string[] = [];

  for (const session of sessions) {
    if (!session.sessionDbPath) {
      skippedSessionIds.push(session.id);
      continue;
    }

    let reader: SessionDbReader | null = null;
    try {
      reader = new SessionDbReader(session.sessionDbPath);
      const todos = reader.getTodos();

      for (const sessionTodo of todos) {
        db.upsertTodo({
          projectId,
          externalId: sessionTodo.id,
          title: sessionTodo.title,
          description: sessionTodo.description,
          status: sessionTodo.status,
          isArchived: false,
          sessionIds: [session.id],
          sourceMetadata: {
            sourceSessionId: session.id,
            sourceSessionName: session.sessionName,
            migratedAt: Date.now(),
          },
          createdAt: sessionTodo.createdAt,
          updatedAt: sessionTodo.updatedAt,
        });
        count++;
      }
    } catch {
      skippedSessionIds.push(session.id);
    } finally {
      reader?.close();
    }
  }

  db.insertMigration(
    `Migrated ${count} todos from ${sessions.length - skippedSessionIds.length} ` +
      `sessions for project ${projectId} (${skippedSessionIds.length} skipped)`,
  );

  return { success: true, count, skippedSessionIds };
}
