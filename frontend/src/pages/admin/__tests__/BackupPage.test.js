// frontend/src/pages/admin/__tests__/BackupPage.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BackupPage from '../BackupPage';
import { getBackupStatus, exportBackup, importBackup } from '../../../services/backupService';
import { useAuth } from '../../../context/AuthContext';

jest.mock('../../../services/backupService', () => ({
  getBackupStatus: jest.fn(),
  exportBackup: jest.fn(),
  importBackup: jest.fn(),
}));

jest.mock('../../../services/apiClient', () => ({
  dispatchToast: jest.fn(),
}));

jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('BackupPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
    }));
    useAuth.mockReturnValue({ isAdmin: true });
    getBackupStatus.mockResolvedValue({ importAvailable: true, environment: 'development' });
  });

  it('shows Access Denied alert for non-admin users', () => {
    useAuth.mockReturnValue({ isAdmin: false });
    render(<BackupPage />);

    expect(screen.getByRole('alert')).toHaveTextContent(/Access Denied/i);
  });

  it('renders dev status badge and triggers JSON/XLSX export', async () => {
    exportBackup.mockResolvedValue({ filename: 'finstat-backup.json' });
    render(<BackupPage />);

    await waitFor(() => {
      expect(screen.getByText('Dev Mode — Restore Enabled')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Download Backup \(JSON\)/i }));
    await waitFor(() => {
      expect(exportBackup).toHaveBeenCalledWith('json');
    });
  });

  it('runs dry-run import and renders delta results table and mobile cards', async () => {
    importBackup.mockResolvedValue({
      dryRun: true,
      durationMs: 25,
      collections: {
        expenses: { willDelete: 10, willInsert: 15 },
      },
    });

    const { container } = render(<BackupPage />);

    await waitFor(() => {
      expect(screen.getByText('Dev Mode — Restore Enabled')).toBeInTheDocument();
    });

    const fileInput = container.querySelector('#backup-file-input');
    const file = new File(['{}'], 'backup.json', { type: 'application/json' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(screen.getByRole('button', { name: /Run Dry Run Validation/i }));

    await waitFor(() => {
      expect(screen.getByTestId('backup-delta-table')).toBeInTheDocument();
    });

    expect(screen.getByText('expenses')).toBeInTheDocument();
    expect(screen.getByText('+5')).toBeInTheDocument();
  });

  it('gates destructive full restore behind RESTORE modal confirmation', async () => {
    importBackup.mockResolvedValue({ dryRun: false, durationMs: 30, collections: {} });
    const { container } = render(<BackupPage />);

    await waitFor(() => {
      expect(screen.getByText('Dev Mode — Restore Enabled')).toBeInTheDocument();
    });

    const fileInput = container.querySelector('#backup-file-input');
    const file = new File(['{}'], 'backup.json', { type: 'application/json' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(screen.getByLabelText(/Dry Run Mode/i));
    fireEvent.click(screen.getByRole('button', { name: /Execute Full Restore/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    const confirmBtn = screen.getByRole('button', { name: /Confirm & Restore/i });
    expect(confirmBtn).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText('RESTORE'), { target: { value: 'RESTORE' } });
    expect(confirmBtn).not.toBeDisabled();

    fireEvent.click(confirmBtn);
    await waitFor(() => {
      expect(importBackup).toHaveBeenCalledWith(file, { dryRun: false, allowUsers: false });
    });
  });
});
