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

import type { RPCSchema } from 'electrobun/bun';

/**
 * Data transfer object for a project.
 */
export interface ProjectDto {
  id: string;
  name: string;
  cwd: string;
  sessionCount: number;
  todoCount: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * Data transfer object for a session.
 */
export interface SessionDto {
  id: string;
  projectId: string;
  sessionName: string;
  sessionPath: string;
  sessionDbPath: string | null;
  lastModified: number;
  createdAt: number;
  hasDb: boolean;
}

/**
 * Data transfer object for a todo item.
 */
export interface TodoDto {
  id: string;
  projectId: string;
  externalId: string | null;
  title: string;
  description: string;
  status: string;
  isArchived: boolean;
  sessionIds: string[];
  createdAt: number;
  updatedAt: number;
}

/**
 * RPC schema defining the typed communication interface between
 * the Bun main process and the webview renderer.
 */
export type AppRPCType = RPCSchema<{
  bun: {
    requests: {
      /** Scans ~/.copilot/session-state and syncs all sessions into registry. */
      scanAndSyncSessions: {
        params: Record<string, never>;
        response: { success: boolean; projectCount: number; sessionCount: number };
      };
      /** Returns all projects from the registry. */
      getProjects: {
        params: Record<string, never>;
        response: ProjectDto[];
      };
      /** Returns sessions for a given project. */
      getSessions: {
        params: { projectId: string };
        response: SessionDto[];
      };
      /** Returns todos for a given project (non-archived). */
      getProjectTodos: {
        params: { projectId: string };
        response: TodoDto[];
      };
      /** Adds a new todo to a project. */
      addTodo: {
        params: { projectId: string; title: string; description: string; status: string };
        response: TodoDto;
      };
      /** Updates an existing todo. */
      updateTodo: {
        params: { todoId: string; title?: string; description?: string; status?: string };
        response: TodoDto;
      };
      /** Archives a todo (soft delete). */
      archiveTodo: {
        params: { todoId: string };
        response: boolean;
      };
      /** Migrates todos from a specific project's sessions into the registry. */
      migrateSessions: {
        params: { projectId: string };
        response: { success: boolean; count: number };
      };
      /** Returns the current application settings. */
      getSettings: {
        params: Record<string, never>;
        response: AppSettings;
      };
      /** Persists updated application settings. */
      updateSettings: {
        params: AppSettings;
        response: { success: boolean };
      };
    };
    messages: Record<string, never>;
  };
  webview: {
    requests: Record<string, never>;
    messages: {
      /** Emitted during scan to report progress. */
      scanProgress: { stage: string; progress: number };
      /** Emitted when underlying data has changed. */
      dataChanged: Record<string, never>;
    };
  };
}>;

/**
 * Application-level settings stored in the registry.
 */
export interface AppSettings {
  /** Override path for the Copilot session-state directory. */
  copilotPath: string;
}
