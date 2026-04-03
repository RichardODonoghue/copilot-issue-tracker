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
import { AddEditTodoModal } from '../../modals/AddEditTodoModal';
import type { TodoDto } from '../../../../shared/types';

const BASE_TODO: TodoDto = {
  id: 'todo-1',
  projectId: 'proj-1',
  externalId: null,
  title: 'Existing task',
  description: 'Existing description',
  status: 'in_progress',
  isArchived: false,
  sessionIds: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

describe('AddEditTodoModal', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <AddEditTodoModal
        isOpen={false}
        todo={null}
        projectId="proj-1"
        onClose={() => {}}
        onSave={() => {}}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows "Add Todo" heading in create mode', () => {
    render(
      <AddEditTodoModal
        isOpen={true}
        todo={null}
        projectId="proj-1"
        onClose={() => {}}
        onSave={() => {}}
      />,
    );
    expect(screen.getAllByText('Add Todo').length).toBeGreaterThan(0);
  });

  it('shows "Edit Todo" heading in edit mode', () => {
    render(
      <AddEditTodoModal
        isOpen={true}
        todo={BASE_TODO}
        projectId="proj-1"
        onClose={() => {}}
        onSave={() => {}}
      />,
    );
    expect(screen.getByText('Edit Todo')).toBeTruthy();
  });

  it('pre-fills fields with existing todo values in edit mode', () => {
    render(
      <AddEditTodoModal
        isOpen={true}
        todo={BASE_TODO}
        projectId="proj-1"
        onClose={() => {}}
        onSave={() => {}}
      />,
    );
    const titleInput = screen.getByPlaceholderText('Todo title') as HTMLInputElement;
    expect(titleInput.value).toBe('Existing task');
    const descInput = screen.getByPlaceholderText('Optional description') as HTMLTextAreaElement;
    expect(descInput.value).toBe('Existing description');
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = mock(() => {});
    render(
      <AddEditTodoModal
        isOpen={true}
        todo={null}
        projectId="proj-1"
        onClose={onClose}
        onSave={() => {}}
      />,
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows a validation error and does not call onSave when title is empty', () => {
    const onSave = mock(() => {});
    render(
      <AddEditTodoModal
        isOpen={true}
        todo={null}
        projectId="proj-1"
        onClose={() => {}}
        onSave={onSave}
      />,
    );
    fireEvent.click(screen.getByText('Add Todo', { selector: 'button' }));
    expect(screen.getByText('Title is required.')).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('calls onSave with trimmed values when title is valid', () => {
    const onSave = mock((_data: { title: string; description: string; status: string }) => {});
    render(
      <AddEditTodoModal
        isOpen={true}
        todo={null}
        projectId="proj-1"
        onClose={() => {}}
        onSave={onSave}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText('Todo title'), {
      target: { value: '  New task  ' },
    });
    fireEvent.change(screen.getByPlaceholderText('Optional description'), {
      target: { value: 'A description' },
    });
    fireEvent.click(screen.getByText('Add Todo', { selector: 'button' }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0]).toEqual({
      title: 'New task',
      description: 'A description',
      status: 'pending',
    });
  });
});
