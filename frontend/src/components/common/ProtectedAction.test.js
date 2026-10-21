// frontend/src/components/common/ProtectedAction.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthProvider } from '../../context/AuthContext';
import { ProtectedAction } from './ProtectedAction';

describe('ProtectedAction Component Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const renderWithAuth = (ui, role = 'viewer') => {
    localStorage.setItem('token', 'fake-token');
    localStorage.setItem('user', JSON.stringify({ id: 'u1', username: 'testuser', role }));
    return render(<AuthProvider>{ui}</AuthProvider>);
  };

  it('1. Renders child button enabled and clickable for manager role', () => {
    const handleClick = jest.fn();
    renderWithAuth(
      <ProtectedAction>
        <button onClick={handleClick}>Submit Transaction</button>
      </ProtectedAction>,
      'manager'
    );

    const button = screen.getByRole('button', { name: 'Submit Transaction' });
    expect(button).not.toBeDisabled();
    expect(button).not.toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('2. Renders child button disabled with tooltip for viewer role', () => {
    const handleClick = jest.fn();
    renderWithAuth(
      <ProtectedAction tooltip="View-only access">
        <button onClick={handleClick}>Delete Item</button>
      </ProtectedAction>,
      'viewer'
    );

    const button = screen.getByRole('button', { name: 'Delete Item' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('tabIndex', '-1');

    const wrapper = button.closest('.protected-action-wrapper');
    expect(wrapper).toHaveAttribute('title', 'View-only access');

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('3. Renders null when hide={true} for viewer role', () => {
    renderWithAuth(
      <ProtectedAction hide={true}>
        <button>Hidden Add Button</button>
      </ProtectedAction>,
      'viewer'
    );

    expect(screen.queryByText('Hidden Add Button')).toBeNull();
  });

  it('4. Clones Link/Anchor with aria-disabled and prevents click navigation for viewer role', () => {
    const handleClick = jest.fn();
    renderWithAuth(
      <ProtectedAction>
        <a href="/trades/new" onClick={handleClick}>
          New Trade
        </a>
      </ProtectedAction>,
      'viewer'
    );

    const link = screen.getByText('New Trade');
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('tabIndex', '-1');

    fireEvent.click(link);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('5. Clones Link/Anchor and prevents keyboard navigation (Enter and Space keys) for viewer role', () => {
    const handleClick = jest.fn();
    renderWithAuth(
      <ProtectedAction>
        <a href="/expenditures/new" onClick={handleClick}>
          Add Expense
        </a>
      </ProtectedAction>,
      'viewer'
    );

    const link = screen.getByText('Add Expense');

    const enterEvent = fireEvent.keyDown(link, { key: 'Enter', code: 'Enter' });
    expect(enterEvent).toBe(false); // defaultPrevented

    const spaceEvent = fireEvent.keyDown(link, { key: ' ', code: 'Space' });
    expect(spaceEvent).toBe(false); // defaultPrevented

    expect(handleClick).not.toHaveBeenCalled();
  });
});
