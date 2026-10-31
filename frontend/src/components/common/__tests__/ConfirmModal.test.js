// frontend/src/components/common/__tests__/ConfirmModal.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmModal from '../ConfirmModal';

describe('ConfirmModal Component Tests [SIMP-009, GAP-010]', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    document.body.style.overflow = '';
  });

  test('1. renders nothing when isOpen is false', () => {
    const { container } = render(
      <ConfirmModal {...defaultProps} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('2. renders title, message, confirmText, and cancelText when isOpen is true', () => {
    render(
      <ConfirmModal
        {...defaultProps}
        title="Delete Transaction"
        message="This will permanently delete the transaction."
        confirmText="Yes, Delete"
        cancelText="No, Keep It"
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Delete Transaction' })).toBeInTheDocument();
    expect(screen.getByText('This will permanently delete the transaction.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Yes, Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No, Keep It' })).toBeInTheDocument();
  });

  test('3. renders default button labels when confirmText and cancelText are omitted', () => {
    render(<ConfirmModal {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  test('4. calls onConfirm when confirm button is clicked', () => {
    const onConfirm = jest.fn();
    render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} />);

    const confirmBtn = screen.getByRole('button', { name: 'Confirm' });
    fireEvent.click(confirmBtn);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(defaultProps.onCancel).not.toHaveBeenCalled();
  });

  test('5. calls onCancel when cancel button is clicked', () => {
    const onCancel = jest.fn();
    render(<ConfirmModal {...defaultProps} onCancel={onCancel} />);

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelBtn);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('6. calls onCancel when clicking outside modal content (overlay)', () => {
    const onCancel = jest.fn();
    render(<ConfirmModal {...defaultProps} onCancel={onCancel} />);

    const overlay = screen.getByTestId('confirm-modal-overlay');
    fireEvent.click(overlay);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('7. does not call onCancel when clicking modal content body', () => {
    const onCancel = jest.fn();
    render(<ConfirmModal {...defaultProps} onCancel={onCancel} />);

    const content = screen.getByTestId('confirm-modal-content');
    fireEvent.click(content);

    expect(onCancel).not.toHaveBeenCalled();
  });

  test('8. calls onCancel when Escape key is pressed', () => {
    const onCancel = jest.fn();
    render(<ConfirmModal {...defaultProps} onCancel={onCancel} />);

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('9. locks document.body overflow on open and restores on unmount/close', () => {
    const { unmount, rerender } = render(<ConfirmModal {...defaultProps} isOpen={true} />);
    expect(document.body.style.overflow).toBe('hidden');

    rerender(<ConfirmModal {...defaultProps} isOpen={false} />);
    expect(document.body.style.overflow).toBe('');

    rerender(<ConfirmModal {...defaultProps} isOpen={true} />);
    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  test('10. applies danger variant styling and disables buttons when isLoading is true', () => {
    render(<ConfirmModal {...defaultProps} variant="danger" isLoading={true} />);

    const confirmBtn = screen.getByRole('button', { name: /processing/i });
    const cancelBtn = screen.getByRole('button', { name: /cancel/i });

    expect(confirmBtn).toHaveClass('confirm-modal-btn-danger');
    expect(confirmBtn).toBeDisabled();
    expect(cancelBtn).toBeDisabled();
  });

  test('11. traps focus within modal when Tab is pressed on last element', () => {
    render(<ConfirmModal {...defaultProps} />);

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    const confirmBtn = screen.getByRole('button', { name: 'Confirm' });

    // Focus confirmBtn (last element) and press Tab -> should wrap to cancelBtn (first element)
    confirmBtn.focus();
    expect(document.activeElement).toBe(confirmBtn);

    fireEvent.keyDown(confirmBtn, { key: 'Tab', shiftKey: false });
    expect(document.activeElement).toBe(cancelBtn);

    // Focus cancelBtn (first element) and press Shift+Tab -> should wrap to confirmBtn (last element)
    fireEvent.keyDown(cancelBtn, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(confirmBtn);
  });
});

