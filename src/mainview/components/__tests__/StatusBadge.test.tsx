/**
 * copilot-issue-tracker - GitHub Copilot session database viewer
 * Copyright (C) 2026  Contributors
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 */

import { describe, it, expect } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../StatusBadge';

describe('StatusBadge', () => {
  it('renders "pending" with gray styles', () => {
    render(<StatusBadge status="pending" />);
    const badge = screen.getByText('pending');
    expect(badge).toBeTruthy();
    expect(badge.className).toContain('bg-gray-100');
    expect(badge.className).toContain('text-gray-700');
  });

  it('renders "in progress" label for in_progress status', () => {
    render(<StatusBadge status="in_progress" />);
    // underscore replaced with space
    expect(screen.getByText('in progress')).toBeTruthy();
  });

  it('renders "in_progress" with blue styles', () => {
    const { container } = render(<StatusBadge status="in_progress" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('bg-blue-100');
    expect(badge?.className).toContain('text-blue-700');
  });

  it('renders "done" with green styles', () => {
    const { container } = render(<StatusBadge status="done" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('bg-green-100');
    expect(badge?.className).toContain('text-green-700');
  });

  it('renders "blocked" with red styles', () => {
    const { container } = render(<StatusBadge status="blocked" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('bg-red-100');
    expect(badge?.className).toContain('text-red-700');
  });

  it('falls back to gray styles for an unknown status', () => {
    const { container } = render(<StatusBadge status="unknown_status" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('bg-gray-100');
    expect(badge?.className).toContain('text-gray-700');
  });
});
