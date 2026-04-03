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
import { TodosTable } from '../TodosTable';
import type { TodoDto } from '../../../shared/types';

/** Builds a minimal TodoDto for tests. */
function makeTodo(overrides: Partial<TodoDto> = {}): TodoDto {
  return {
    id: 'todo-1',
    projectId: 'proj-1',
    externalId: null,
    title: 'Default task',
    description: '',
    status: 'pending',
    isArchived: false,
    sessionIds: ['s-1'],
    createdAt: Date.now(),
    updatedAt: Date.now() - 1000,
    ...overrides,
  };
}

describe('TodosTable', () => {
  it('renders an empty state when the todos array is empty', () => {
    render(
      <TodosTable
        todos={[]}
        onAdd={() => {}}
        onEdit={() => {}}
        onArchive={() => {}}
        onChangeStatus={() => {}}
      />,
    );
    expect(screen.getByText('No todos found.')).toBeTruthy();
  });

  it('renders a row for each todo', () => {
    const todos = [
      makeTodo({ id: 't-1', title: 'First task' }),
      makeTodo({ id: 't-2', title: 'Second task' }),
    ];
    render(
      <TodosTable
        todos={todos}
        onAdd={() => {}}
        onEdit={() => {}}
        onArchive={() => {}}
        onChangeStatus={() => {}}
      />,
    );
    expect(screen.getByText('First task')).toBeTruthy();
    expect(screen.getByText('Second task')).toBeTruthy();
  });

  it('calls onAdd when the Add Todo button is clicked', () => {
    const onAdd = mock(() => {});
    render(
      <TodosTable
        todos={[]}
        onAdd={onAdd}
        onEdit={() => {}}
        onArchive={() => {}}
        onChangeStatus={() => {}}
      />,
    );
    fireEvent.click(screen.getByText('+ Add Todo'));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('calls onEdit with the correct todo when Edit is clicked', () => {
    const onEdit = mock((_todo: TodoDto) => {});
    const todo = makeTodo({ title: 'Editable task' });
    render(
      <TodosTable
        todos={[todo]}
        onAdd={() => {}}
        onEdit={onEdit}
        onArchive={() => {}}
        onChangeStatus={() => {}}
      />,
    );
    fireEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledWith(todo);
  });

  it('calls onArchive with the correct todo when Archive is clicked', () => {
    const onArchive = mock((_todo: TodoDto) => {});
    const todo = makeTodo({ title: 'Archiveable task' });
    render(
      <TodosTable
        todos={[todo]}
        onAdd={() => {}}
        onEdit={() => {}}
        onArchive={onArchive}
        onChangeStatus={() => {}}
      />,
    );
    fireEvent.click(screen.getByText('Archive'));
    expect(onArchive).toHaveBeenCalledWith(todo);
  });

  it('filters todos by selected status', () => {
    const todos = [
      makeTodo({ id: 't-1', title: 'Pending task', status: 'pending' }),
      makeTodo({ id: 't-2', title: 'Done task', status: 'done' }),
    ];
    render(
      <TodosTable
        todos={todos}
        onAdd={() => {}}
        onEdit={() => {}}
        onArchive={() => {}}
        onChangeStatus={() => {}}
      />,
    );
    // Change filter to 'done' — target the filter combobox via its label
    const allSelects = screen.getAllByRole('combobox');
    fireEvent.change(allSelects[0], {
      target: { value: 'done' },
    });
    expect(screen.getByText('Done task')).toBeTruthy();
    expect(screen.queryByText('Pending task')).toBeNull();
  });

  it('expands the description accordion when the chevron button is clicked', () => {
    const todo = makeTodo({ description: 'A detailed description here' });
    render(
      <TodosTable
        todos={[todo]}
        onAdd={() => {}}
        onEdit={() => {}}
        onArchive={() => {}}
        onChangeStatus={() => {}}
      />,
    );
    // Description should not be visible initially in the expanded panel
    expect(screen.queryByText('Description')).toBeNull();
    // Click the expand button
    fireEvent.click(screen.getByLabelText('Expand description'));
    expect(screen.getByText('Description')).toBeTruthy();
  });

  it('does not show a chevron for todos with no description', () => {
    const todo = makeTodo({ description: '' });
    render(
      <TodosTable
        todos={[todo]}
        onAdd={() => {}}
        onEdit={() => {}}
        onArchive={() => {}}
        onChangeStatus={() => {}}
      />,
    );
    expect(screen.queryByLabelText('Expand description')).toBeNull();
  });

  it('sorts todos by title ascending when Title header is clicked', () => {
    const todos = [
      makeTodo({ id: 't-b', title: 'Banana' }),
      makeTodo({ id: 't-a', title: 'Apple' }),
      makeTodo({ id: 't-c', title: 'Cherry' }),
    ];
    render(
      <TodosTable
        todos={todos}
        onAdd={() => {}}
        onEdit={() => {}}
        onArchive={() => {}}
        onChangeStatus={() => {}}
      />,
    );
    fireEvent.click(screen.getByText('Title'));
    const rows = document.querySelectorAll('tbody tr');
    // First data row (not accordion row) should be Apple
    expect(rows[0].textContent).toContain('Apple');
  });
});
