// frontend/src/pages/profile/__tests__/ProfilePage.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfilePage from '../ProfilePage';
import { getUserProfile, updateUserProfile } from '../../../services/userService';

const mockAddToast = jest.fn();

jest.mock('../../../context/ToastContext', () => ({
  useToast: () => ({
    addToast: mockAddToast,
  }),
}));

jest.mock('../../../services/userService', () => ({
  getUserProfile: jest.fn(),
  updateUserProfile: jest.fn(),
}));

describe('Phase 10A: ProfilePage Unit Tests', () => {
  const mockProfileResponse = {
    user: {
      username: 'admin_user',
      email: 'admin@finstat.local',
      role: 'admin',
      fullName: 'Ahmed Mansour',
      dateOfBirth: '1990-05-15T00:00:00.000Z',
      nationalId: '29005151234567',
      phone: '+20 100 555 0199',
      address: '12 El-Galaa St, Heliopolis, Cairo',
      title: 'Principal Financial Analyst',
      company: 'FinStat Advisory',
      department: 'Portfolio & Risk',
      employeeId: 'EMP-1042',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getUserProfile.mockResolvedValue(mockProfileResponse);
    updateUserProfile.mockResolvedValue({ message: 'Profile updated successfully!' });
  });

  it('loads profile data, renders neutral role Badge, and pairs all 12 labels', async () => {
    render(<ProfilePage />);

    expect(screen.getByRole('status', { name: /Loading profile/i })).toBeInTheDocument();

    const fullNameInput = await screen.findByLabelText(/Full Name/i);
    expect(fullNameInput).toHaveValue('Ahmed Mansour');
    expect(screen.getByLabelText(/Date of Birth/i)).toHaveValue('1990-05-15');
    expect(screen.getByLabelText(/Date of Birth/i)).toHaveClass('fs-num');
    expect(screen.getByLabelText(/National ID \/ Passport/i)).toHaveClass('fs-mono');
    expect(screen.getByLabelText(/Phone Number/i)).toHaveClass('fs-num');
    expect(screen.getByLabelText(/Email Address/i)).toHaveValue('admin@finstat.local');
    expect(screen.getByLabelText(/Residential Address/i)).toHaveValue('12 El-Galaa St, Heliopolis, Cairo');
    expect(screen.getByLabelText(/Job Title \/ Role/i)).toHaveValue('Principal Financial Analyst');
    expect(screen.getByLabelText(/Company \/ Employer/i)).toHaveValue('FinStat Advisory');
    expect(screen.getByLabelText(/Department \/ Unit/i)).toHaveValue('Portfolio & Risk');
    expect(screen.getByLabelText(/Employee \/ Staff ID/i)).toHaveClass('fs-mono');
    expect(screen.getByLabelText(/System Username/i)).toBeDisabled();
    expect(screen.getByLabelText(/Access Role/i)).toBeDisabled();
    expect(screen.getByText('ADMIN')).toHaveClass('fs-badge');
  });

  it('submits updated profile fields and triggers toast feedback', async () => {
    render(<ProfilePage />);

    const fullNameInput = await screen.findByLabelText(/Full Name/i);
    fireEvent.change(fullNameInput, { target: { value: 'Ahmed M. Mansour' } });

    const saveBtn = screen.getByRole('button', { name: /Save Profile Changes/i });
    expect(saveBtn).toHaveClass('fs-btn-primary');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(updateUserProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Ahmed M. Mansour',
          email: 'admin@finstat.local',
        })
      );
    });
    expect(mockAddToast).toHaveBeenCalledWith('Profile updated successfully!', 'success');
  });
});

