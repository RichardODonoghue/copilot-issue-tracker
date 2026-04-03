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
 * Parses Copilot workspace.yaml files to extract workspace configuration.
 * Uses simple line-by-line parsing since workspace.yaml has a flat key: value
 * structure and no external YAML library is needed.
 */
export class WorkspaceYamlParser {
  /**
   * Parses a workspace.yaml file and returns the cwd property.
   * Handles missing files and malformed content gracefully.
   * @param filePath Absolute path to the workspace.yaml file.
   * @returns Object with cwd string, or null if unavailable.
   */
  static async parse(filePath: string): Promise<{ cwd: string } | null> {
    try {
      const file = Bun.file(filePath);
      const exists = await file.exists();
      if (!exists) return null;

      const content = await file.text();
      const cwd = WorkspaceYamlParser.extractCwd(content);
      if (!cwd) return null;

      return { cwd };
    } catch {
      return null;
    }
  }

  /**
   * Extracts the cwd value from raw YAML content using line-by-line parsing.
   * Handles quoted and unquoted values, and leading/trailing whitespace.
   * @param content Raw YAML string content.
   * @returns The cwd value, or null if not found.
   */
  private static extractCwd(content: string): string | null {
    for (const line of content.split('\n')) {
      const match = line.match(/^cwd\s*:\s*(.+)$/);
      if (match) {
        let value = match[1].trim();
        // Strip surrounding quotes if present
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (value.length > 0) return value;
      }
    }
    return null;
  }
}
