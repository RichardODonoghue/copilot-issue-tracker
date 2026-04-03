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

import { describe, it, expect } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { ProjectCard } from '../ProjectCard';
import type { ProjectDto } from '../../../shared/types';

const mockProject: ProjectDto = {
  id: 'project-1',
  name: 'my-awesome-project',
  cwd: '/home/user/my-awesome-project',
  sessionCount: 3,
  todoCount: 7,
  createdAt: Date.now() - 86400000,
  updatedAt: Date.now() - 3600000,
};

describe('ProjectCard', () => {
  it('renders the project name', () => {
    render(<ProjectCard project={mockProject} onClick={() => {}} />);
    expect(screen.getByText('my-awesome-project')).toBeTruthy();
  });

  it('renders the cwd path', () => {
    render(<ProjectCard project={mockProject} onClick={() => {}} />);
    expect(screen.getByText('/home/user/my-awesome-project')).toBeTruthy();
  });

  it('renders the session count badge', () => {
    render(<ProjectCard project={mockProject} onClick={() => {}} />);
    expect(screen.getByText(/3 sessions/)).toBeTruthy();
  });

  it('renders the todo count badge', () => {
    render(<ProjectCard project={mockProject} onClick={() => {}} />);
    expect(screen.getByText(/7 todos/)).toBeTruthy();
  });

  it('calls onClick when the card is clicked', () => {
    let clicked = false;
    render(
      <ProjectCard
        project={mockProject}
        onClick={() => {
          clicked = true;
        }}
      />,
    );
    screen
      .getByText('my-awesome-project')
      .closest('[role="button"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(clicked).toBe(true);
  });

  it('uses singular "session" for count of 1', () => {
    const single = { ...mockProject, sessionCount: 1, todoCount: 1 };
    const { container } = render(<ProjectCard project={single} onClick={() => {}} />);
    // Badge text is split across child nodes; normalize whitespace before asserting.
    const sessionBadge = container.querySelector('.bg-indigo-50');
    const sessionText = (sessionBadge?.textContent ?? '').replace(/\s+/g, ' ').trim();
    expect(sessionText).toMatch(/1 session$/);
    const todoBadge = container.querySelector('.bg-amber-50');
    const todoText = (todoBadge?.textContent ?? '').replace(/\s+/g, ' ').trim();
    expect(todoText).toMatch(/1 todo$/);
  });
});
