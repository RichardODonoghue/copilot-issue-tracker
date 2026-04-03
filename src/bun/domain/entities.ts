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

/**
 * Represents a project derived from the cwd of a Copilot session workspace.
 */
export interface Project {
  id: string;
  name: string;
  cwd: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Represents a discovered Copilot session linked to a project.
 */
export interface Session {
  id: string;
  projectId: string;
  sessionName: string;
  sessionPath: string;
  sessionDbPath: string | null;
  lastModified: number;
  createdAt: number;
}

/**
 * Represents a todo item stored in the local registry database.
 */
export interface Todo {
  id: string;
  projectId: string;
  externalId: string | null;
  title: string;
  description: string;
  status: string;
  isArchived: boolean;
  sessionIds: string[];
  sourceMetadata: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

/**
 * Records a migration event for audit purposes.
 */
export interface MigrationRecord {
  id: string;
  summary: string;
  createdAt: number;
}

/**
 * Represents a todo item as read from an external session.db file.
 */
export interface SessionTodo {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: number;
  updatedAt: number;
}
