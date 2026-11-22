// frontend/src/pages/salary/__tests__/EditProfilePage.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EditProfilePage from '../EditProfilePage';
import { getProfile, updateProfileDetails } from '../../../services/salaryService';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = require('../../../../node_modules/react-router/dist/development/index.js');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
}, { virtual: true });

jest.mock('../../../services/salaryService', () => ({
  getProfile: jest.fn(),
  updateProfileDetails: jest.fn(),
}));

const mockProfile = {
  _id: 'prof_123',
  name: 'Sara Nour',
  title: 'Lead Financial Analyst',
  position: 'Finance Operations',
  year: 2026,
};

const renderEditProfile = () => {
  return render(
    <MemoryRouter initialEntries={['/salary-profile/edit']}>
      <EditProfilePage />
    </MemoryRouter>
  );
};

describe('EditProfilePage Component (Phase 5E)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('1. loads profile details and populates form fields', async () => {
    getProfile.mockResolvedValue(mockProfile);
    renderEditProfile();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Sara Nour')).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue('Lead Financial Analyst')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Finance Operations')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2026')).toBeInTheDocument();
  });

  test('2. updates form inputs on change', async () => {
    getProfile.mockResolvedValue(mockProfile);
    renderEditProfile();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Sara Nour')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/Full Name/i);
    fireEvent.change(nameInput, { target: { name: 'name', value: 'Sara N. Mansour' } });
    expect(screen.getByDisplayValue('Sara N. Mansour')).toBeInTheDocument();

    const titleInput = screen.getByLabelText(/Job Title/i);
    fireEvent.change(titleInput, { target: { name: 'title', value: 'VP of Finance' } });
    expect(screen.getByDisplayValue('VP of Finance')).toBeInTheDocument();
  });

  test('3. submits updated details and navigates to /salary/profiles on save', async () => {
    getProfile.mockResolvedValue(mockProfile);
    updateProfileDetails.mockResolvedValue({ success: true });
    renderEditProfile();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Sara Nour')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/Full Name/i);
    fireEvent.change(nameInput, { target: { name: 'name', value: 'Sara Mansour' } });

    const submitBtn = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(updateProfileDetails).toHaveBeenCalledWith({
        name: 'Sara Mansour',
        title: 'Lead Financial Analyst',
        position: 'Finance Operations',
        year: 2026,
      });
    });
    expect(mockNavigate).toHaveBeenCalledWith('/salary/profiles');
  });

  test('4. cancel button links back to /salary/profiles', async () => {
    getProfile.mockResolvedValue(mockProfile);
    renderEditProfile();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Sara Nour')).toBeInTheDocument();
    });

    const cancelLink = screen.getByRole('link', { name: /Cancel/i });
    expect(cancelLink).toHaveAttribute('href', '/salary/profiles');
  });
});
