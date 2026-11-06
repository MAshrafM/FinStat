// frontend/src/components/common/__tests__/UndoToast.test.js
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import UndoToast from '../UndoToast';

describe('Step 7C.2b: [FEAT-006, GAP-004] UndoToast Component Unit Tests', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('1. does not render when isOpen is false', () => {
    const { container } = render(
      <UndoToast isOpen={false} onUndo={jest.fn()} onDismiss={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('undo-toast')).not.toBeInTheDocument();
  });

  it('2. renders with default message and initial countdown when isOpen is true', () => {
    render(<UndoToast isOpen={true} onUndo={jest.fn()} onDismiss={jest.fn()} />);

    expect(screen.getByTestId('undo-toast')).toBeInTheDocument();
    expect(screen.getByText(/Item deleted \(10s\)/i)).toBeInTheDocument();
    expect(screen.getByTestId('undo-button')).toBeInTheDocument();
  });

  it('3. renders custom message and custom duration', () => {
    render(
      <UndoToast
        isOpen={true}
        message="Expenditure removed"
        duration={5}
        onUndo={jest.fn()}
        onDismiss={jest.fn()}
      />
    );

    expect(screen.getByText(/Expenditure removed \(5s\)/i)).toBeInTheDocument();
  });

  it('4. decrements countdown timer every 1000ms', () => {
    render(
      <UndoToast
        isOpen={true}
        duration={10}
        onUndo={jest.fn()}
        onDismiss={jest.fn()}
      />
    );

    expect(screen.getByText(/10s/i)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText(/9s/i)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(screen.getByText(/6s/i)).toBeInTheDocument();
  });

  it('5. automatically calls onDismiss when timer reaches 0', () => {
    const mockDismiss = jest.fn();
    render(
      <UndoToast
        isOpen={true}
        duration={3}
        onUndo={jest.fn()}
        onDismiss={mockDismiss}
      />
    );

    expect(mockDismiss).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });

  it('6. clicking "Undo" button calls onUndo and onDismiss', async () => {
    const mockUndo = jest.fn().mockResolvedValue();
    const mockDismiss = jest.fn();

    render(
      <UndoToast
        isOpen={true}
        onUndo={mockUndo}
        onDismiss={mockDismiss}
      />
    );

    const undoButton = screen.getByTestId('undo-button');
    await act(async () => {
      fireEvent.click(undoButton);
    });

    expect(mockUndo).toHaveBeenCalledTimes(1);
    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });

  it('7. shows "Restoring..." and disables Undo button while onUndo is in flight', async () => {
    let resolveUndo;
    const undoPromise = new Promise((resolve) => {
      resolveUndo = resolve;
    });
    const mockUndo = jest.fn().mockReturnValue(undoPromise);

    render(
      <UndoToast
        isOpen={true}
        onUndo={mockUndo}
        onDismiss={jest.fn()}
      />
    );

    const undoButton = screen.getByTestId('undo-button');
    act(() => {
      fireEvent.click(undoButton);
    });

    expect(screen.getByText(/Restoring\.\.\./i)).toBeInTheDocument();
    expect(undoButton).toBeDisabled();

    await act(async () => {
      resolveUndo();
    });
  });

  it('8. clicking dismiss button immediately calls onDismiss and stops timer', () => {
    const mockDismiss = jest.fn();
    render(
      <UndoToast
        isOpen={true}
        duration={10}
        onUndo={jest.fn()}
        onDismiss={mockDismiss}
      />
    );

    const dismissButton = screen.getByTestId('undo-dismiss-button');
    fireEvent.click(dismissButton);

    expect(mockDismiss).toHaveBeenCalledTimes(1);

    // Advancing timer after manual dismiss does not call onDismiss again
    act(() => {
      jest.advanceTimersByTime(10000);
    });
    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });

  it('9. clears active interval on component unmount to prevent leaks', () => {
    const mockDismiss = jest.fn();
    const { unmount } = render(
      <UndoToast
        isOpen={true}
        duration={5}
        onUndo={jest.fn()}
        onDismiss={mockDismiss}
      />
    );

    unmount();

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(mockDismiss).not.toHaveBeenCalled();
  });

  it('10. renders accessible attributes (role="alert", aria-live="assertive", aria-label)', () => {
    render(
      <UndoToast
        isOpen={true}
        onUndo={jest.fn()}
        onDismiss={jest.fn()}
      />
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    expect(screen.getByLabelText('Dismiss notification')).toBeInTheDocument();
  });
});
