// frontend/src/context/__tests__/ToastContext.test.js
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../ToastContext';
import { dispatchToast } from '../../services/apiClient';

const TestTrigger = () => {
  const { showToast } = useToast();
  return (
    <div>
      <button type="button" onClick={() => showToast('Request timed out – please try again.', 'error')}>
        Trigger Timeout
      </button>
      <button type="button" onClick={() => showToast('Another error occurred.', 'error')}>
        Trigger Other
      </button>
      <button type="button" onClick={() => showToast('Saved successfully', 'success')}>
        Trigger Success
      </button>
    </div>
  );
};

describe('ToastContext', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('1. deduplicates identical active error toasts', () => {
    render(
      <ToastProvider>
        <TestTrigger />
      </ToastProvider>
    );

    const timeoutBtn = screen.getByRole('button', { name: 'Trigger Timeout' });
    fireEvent.click(timeoutBtn);
    fireEvent.click(timeoutBtn);
    fireEvent.click(timeoutBtn);

    act(() => {
      dispatchToast('Request timed out – please try again.', 'error');
      dispatchToast('Request timed out – please try again.', 'error');
    });

    const matches = screen.getAllByText('Request timed out – please try again.');
    expect(matches).toHaveLength(1);
  });

  test('2. allows distinct messages and types concurrently', () => {
    render(
      <ToastProvider>
        <TestTrigger />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Trigger Timeout' }));
    fireEvent.click(screen.getByRole('button', { name: 'Trigger Other' }));
    fireEvent.click(screen.getByRole('button', { name: 'Trigger Success' }));

    expect(screen.getByText('Request timed out – please try again.')).toBeInTheDocument();
    expect(screen.getByText('Another error occurred.')).toBeInTheDocument();
    expect(screen.getByText('Saved successfully')).toBeInTheDocument();
  });

  test('3. allows same message again after previous toast is dismissed', () => {
    render(
      <ToastProvider>
        <TestTrigger />
      </ToastProvider>
    );

    const timeoutBtn = screen.getByRole('button', { name: 'Trigger Timeout' });
    fireEvent.click(timeoutBtn);
    expect(screen.getAllByText('Request timed out – please try again.')).toHaveLength(1);

    const closeBtn = screen.getByRole('button', { name: /Close notification/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByText('Request timed out – please try again.')).not.toBeInTheDocument();

    fireEvent.click(timeoutBtn);
    expect(screen.getAllByText('Request timed out – please try again.')).toHaveLength(1);
  });
});
