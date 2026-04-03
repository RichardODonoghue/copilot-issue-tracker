/**
 * copilot-issue-tracker - GitHub Copilot session database viewer
 * Copyright (C) 2026  Contributors
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 */

import { describe, it, expect, mock } from 'bun:test';
import { render, screen, fireEvent } from '@testing-library/react';
import { SessionsTable } from '../SessionsTable';
import type { SessionDto } from '../../../shared/types';

const BASE_SESSION: SessionDto = {
  id: 'session-1',
  projectId: 'proj-1',
  sessionName: 'abc123',
  sessionPath: '/home/user/.copilot/session-state/abc123',
  hasDb: true,
  lastModified: Date.now(),
};

describe('SessionsTable', () => {
  it('renders an empty state message when sessions array is empty', () => {
    render(<SessionsTable sessions={[]} onMigrate={() => {}} />);
    expect(screen.getByText('No sessions found.')).toBeTruthy();
  });

  it('renders a row for each session', () => {
    const sessions: SessionDto[] = [
      { ...BASE_SESSION, id: 's-1', sessionName: 'session-alpha' },
      { ...BASE_SESSION, id: 's-2', sessionName: 'session-beta' },
    ];
    render(<SessionsTable sessions={sessions} onMigrate={() => {}} />);
    expect(screen.getByText('session-alpha')).toBeTruthy();
    expect(screen.getByText('session-beta')).toBeTruthy();
  });

  it('shows "Yes" badge when hasDb is true', () => {
    render(<SessionsTable sessions={[{ ...BASE_SESSION, hasDb: true }]} onMigrate={() => {}} />);
    expect(screen.getByText('Yes')).toBeTruthy();
  });

  it('shows "No" when hasDb is false', () => {
    render(<SessionsTable sessions={[{ ...BASE_SESSION, hasDb: false }]} onMigrate={() => {}} />);
    expect(screen.getByText('No')).toBeTruthy();
  });

  it('shows Migrate button only for sessions with a db', () => {
    const sessions: SessionDto[] = [
      { ...BASE_SESSION, id: 's-with', sessionName: 'has-db', hasDb: true },
      { ...BASE_SESSION, id: 's-without', sessionName: 'no-db', hasDb: false },
    ];
    render(<SessionsTable sessions={sessions} onMigrate={() => {}} />);
    // Only one Migrate button rendered
    const buttons = screen.getAllByText('Migrate');
    expect(buttons).toHaveLength(1);
  });

  it('calls onMigrate with the correct session id when Migrate is clicked', () => {
    const onMigrate = mock((_id: string) => {});
    render(<SessionsTable sessions={[BASE_SESSION]} onMigrate={onMigrate} />);
    fireEvent.click(screen.getByText('Migrate'));
    expect(onMigrate).toHaveBeenCalledWith('session-1');
  });

  it('sorts sessions newest-first by lastModified', () => {
    const sessions: SessionDto[] = [
      { ...BASE_SESSION, id: 's-old', sessionName: 'oldest', lastModified: 1000 },
      { ...BASE_SESSION, id: 's-new', sessionName: 'newest', lastModified: 9000 },
      { ...BASE_SESSION, id: 's-mid', sessionName: 'middle', lastModified: 5000 },
    ];
    const { container } = render(<SessionsTable sessions={sessions} onMigrate={() => {}} />);
    const rows = container.querySelectorAll('tbody tr');
    // First row should be "newest"
    expect(rows[0].textContent).toContain('newest');
    expect(rows[2].textContent).toContain('oldest');
  });
});
