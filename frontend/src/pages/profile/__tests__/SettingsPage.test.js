// frontend/src/pages/profile/__tests__/SettingsPage.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SettingsPage from '../SettingsPage';
import { getUserProfile, updateUserProfile } from '../../../services/userService';

const mockAddToast = jest.fn();

jest.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}), { virtual: true });

jest.mock('../../../context/ToastContext', () => ({
  useToast: () => ({
    addToast: mockAddToast,
  }),
}));

jest.mock('../../../services/userService', () => ({
  getUserProfile: jest.fn(),
  updateUserProfile: jest.fn(),
}));

describe('Phase 10A: SettingsPage Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getUserProfile.mockResolvedValue({
      user: { costBasisMethod: 'average' },
    });
    updateUserProfile.mockResolvedValue({
      message: 'Cost-basis settings saved successfully!',
    });
  });

  it('loads costBasisMethod, allows switching to FIFO/LIFO, and submits', async () => {
    render(<SettingsPage />);

    expect(screen.getByRole('status', { name: /Loading application settings/i })).toBeInTheDocument();

    const avgRadio = await screen.findByRole('radio', { name: /Weighted Average/i });
    const fifoRadio = screen.getByRole('radio', { name: /FIFO \(First-In, First-Out\)/i });
    const lifoRadio = screen.getByRole('radio', { name: /LIFO \(Last-In, First-Out\)/i });

    expect(avgRadio).toBeChecked();
    fireEvent.click(fifoRadio);
    expect(fifoRadio).toBeChecked();
    fireEvent.click(lifoRadio);
    expect(lifoRadio).toBeChecked();

    const saveBtn = screen.getByRole('button', { name: /Save Settings/i });
    expect(saveBtn).toHaveClass('fs-btn-primary');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(updateUserProfile).toHaveBeenCalledWith({ costBasisMethod: 'lifo' });
    });
    expect(mockAddToast).toHaveBeenCalledWith('Cost-basis settings saved successfully!', 'success');
    expect(screen.getByTestId('link-recycle-bin')).toHaveAttribute('href', '/settings/recycle-bin');
  });
});
