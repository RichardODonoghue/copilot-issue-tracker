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
import { ConfirmModal } from '../../modals/ConfirmModal';

describe('ConfirmModal', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ConfirmModal
        isOpen={false}
        title="Delete item"
        message="Are you sure?"
        confirmLabel="Delete"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the title and message when open', () => {
    render(
      <ConfirmModal
        isOpen={true}
        title="Delete item"
        message="Are you sure?"
        confirmLabel="Delete"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByText('Delete item')).toBeTruthy();
    expect(screen.getByText('Are you sure?')).toBeTruthy();
  });

  it('renders the custom confirm label', () => {
    render(
      <ConfirmModal
        isOpen={true}
        title="Archive"
        message="Archive this todo?"
        confirmLabel="Archive now"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByText('Archive now')).toBeTruthy();
  });

  it('calls onConfirm when the confirm button is clicked', () => {
    const onConfirm = mock(() => {});
    render(
      <ConfirmModal
        isOpen={true}
        title="Test"
        message="Test message"
        confirmLabel="Yes"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />,
    );
    fireEvent.click(screen.getByText('Yes'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when the Cancel button is clicked', () => {
    const onCancel = mock(() => {});
    render(
      <ConfirmModal
        isOpen={true}
        title="Test"
        message="Test message"
        confirmLabel="Yes"
        onConfirm={() => {}}
        onCancel={onCancel}
      />,
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
