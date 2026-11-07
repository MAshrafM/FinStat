// frontend/src/components/layout/__tests__/AccountSwitcher.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AccountSwitcher from '../AccountSwitcher';
import { AuthContext } from '../../../context/AuthContext';
import * as userService from '../../../services/userService';

jest.mock('../../../services/userService');

describe('AccountSwitcher Component Suite (FEAT-009)', () => {
  const mockSwitchAccount = jest.fn();
  const mockSwitchBackToPrimary = jest.fn();

  const primaryUser = {
    id: 'u-primary-1',
    username: 'alice_parent',
    role: 'manager',
    isDelegatedSession: false,
    delegatedFrom: null,
  };

  const delegatedUser = {
    id: 'u-child-2',
    username: 'bob_child',
    role: 'viewer',
    isDelegatedSession: true,
    delegatedFrom: 'u-primary-1',
  };

  const mockSwitchableAccounts = [
    {
      id: 'u-primary-1',
      username: 'alice_parent',
      fullName: 'Alice Parent',
      role: 'manager',
      relationship: 'self',
      permissions: 'full_access',
      isCurrent: true,
      isSelf: true,
    },
    {
      id: 'u-child-2',
      username: 'bob_child',
      fullName: 'Bob Child',
      role: 'viewer',
      relationship: 'dependent',
      permissions: 'full_access',
      isCurrent: false,
      isManaged: true,
    },
    {
      id: 'u-delegate-3',
      username: 'charlie_investor',
      fullName: 'Charlie Investor',
      role: 'viewer',
      relationship: 'client',
      permissions: 'view_only',
      isCurrent: false,
      isDelegated: true,
    },
  ];

  const mockFamilyRollup = {
    success: true,
    consolidatedNetWorth: 500000,
    consolidatedAssets: 600000,
    consolidatedDebts: 100000,
    rollupCount: 3,
    members: [
      {
        userId: 'u-primary-1',
        username: 'alice_parent',
        fullName: 'Alice Parent',
        role: 'manager',
        relationship: 'self',
        permissions: 'full_access',
        netWorth: 350000,
        totalAssets: 400000,
        totalDebts: 50000,
        holdingsCount: 5,
      },
      {
        userId: 'u-child-2',
        username: 'bob_child',
        fullName: 'Bob Child',
        role: 'viewer',
        relationship: 'dependent',
        permissions: 'full_access',
        netWorth: 150000,
        totalAssets: 200000,
        totalDebts: 50000,
        holdingsCount: 2,
      },
    ],
  };

  const renderComponent = (authOverrides = {}) => {
    const defaultAuth = {
      user: primaryUser,
      token: 'mock-jwt-token',
      role: primaryUser.role,
      isDelegatedSession: false,
      originalUser: null,
      switchAccount: mockSwitchAccount,
      switchBackToPrimary: mockSwitchBackToPrimary,
      ...authOverrides,
    };

    return render(
      <AuthContext.Provider value={defaultAuth}>
        <AccountSwitcher isExpanded={true} />
      </AuthContext.Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    userService.getSwitchableAccounts.mockResolvedValue({
      success: true,
      accounts: mockSwitchableAccounts,
    });
    userService.getFamilyRollup.mockResolvedValue(mockFamilyRollup);
  });

  it('1. Renders active account pill with current username, role badge, and chevron icon', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('active-account-pill')).toHaveAttribute('data-disabled', 'false');
    });

    expect(screen.getByTestId('active-account-username')).toHaveTextContent('alice_parent');
    expect(screen.getByTestId('active-account-role')).toHaveTextContent('manager');
    expect(screen.getByTestId('account-switcher-chevron')).toBeInTheDocument();
  });

  it('2. Clicking active account pill opens dropdown menu showing available accounts', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('active-account-pill')).toHaveAttribute('data-disabled', 'false');
    });

    expect(screen.queryByTestId('account-switcher-dropdown')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('active-account-pill'));

    expect(screen.getByTestId('account-switcher-dropdown')).toBeInTheDocument();
    expect(screen.getByText('@alice_parent')).toBeInTheDocument();
    expect(screen.getByText('@bob_child')).toBeInTheDocument();
    expect(screen.getByText('@charlie_investor')).toBeInTheDocument();
  });

  it('3. Displays primary account and managed/delegated accounts with distinct relationship badges', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('active-account-pill')).toHaveAttribute('data-disabled', 'false');
    });

    fireEvent.click(screen.getByTestId('active-account-pill'));

    expect(screen.getByTestId('badge-relationship-u-primary-1')).toHaveTextContent('Primary');
    expect(screen.getByTestId('badge-relationship-u-child-2')).toHaveTextContent('Dependent');
    expect(screen.getByTestId('badge-relationship-u-delegate-3')).toHaveTextContent('Delegated');
  });

  it('4. Selecting an account from dropdown calls switchAccount with target account ID', async () => {
    mockSwitchAccount.mockResolvedValueOnce({ success: true });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('active-account-pill')).toHaveAttribute('data-disabled', 'false');
    });

    fireEvent.click(screen.getByTestId('active-account-pill'));

    const childAccountRow = screen.getByTestId('switch-account-option-u-child-2');
    fireEvent.click(childAccountRow);

    await waitFor(() => {
      expect(mockSwitchAccount).toHaveBeenCalledWith('u-child-2');
    });
  });

  it('5. Renders persistent amber delegation banner when isDelegatedSession is true', async () => {
    renderComponent({
      user: delegatedUser,
      isDelegatedSession: true,
      originalUser: 'u-primary-1',
    });

    await waitFor(() => {
      expect(screen.getByTestId('delegation-banner')).toBeInTheDocument();
    });

    expect(screen.getByTestId('delegation-banner')).toHaveTextContent('Delegated Session');
    expect(screen.getByTestId('switch-back-btn')).toBeInTheDocument();
  });

  it('6. Clicking "Switch back" button in banner triggers switchBackToPrimary', async () => {
    mockSwitchBackToPrimary.mockResolvedValueOnce({ success: true });
    renderComponent({
      user: delegatedUser,
      isDelegatedSession: true,
      originalUser: 'u-primary-1',
    });

    await waitFor(() => {
      expect(screen.getByTestId('switch-back-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('switch-back-btn'));

    await waitFor(() => {
      expect(mockSwitchBackToPrimary).toHaveBeenCalledTimes(1);
    });
  });

  it('7. Hides account dropdown when clicking outside component', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('active-account-pill')).toHaveAttribute('data-disabled', 'false');
    });

    fireEvent.click(screen.getByTestId('active-account-pill'));
    expect(screen.getByTestId('account-switcher-dropdown')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByTestId('account-switcher-dropdown')).not.toBeInTheDocument();
    });
  });

  it('8. Disables account switcher trigger when user has zero managed accounts and zero delegations', async () => {
    userService.getSwitchableAccounts.mockResolvedValueOnce({
      success: true,
      accounts: [mockSwitchableAccounts[0]], // only self
    });

    renderComponent();

    await waitFor(() => {
      expect(userService.getSwitchableAccounts).toHaveBeenCalled();
    });

    const trigger = screen.getByTestId('active-account-pill');
    expect(trigger).toHaveAttribute('data-disabled', 'true');

    fireEvent.click(trigger);
    expect(screen.queryByTestId('account-switcher-dropdown')).not.toBeInTheDocument();
  });

  it('9. Renders "Family Office Rollup" action button in dropdown menu', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('active-account-pill')).toHaveAttribute('data-disabled', 'false');
    });

    fireEvent.click(screen.getByTestId('active-account-pill'));

    expect(screen.getByTestId('family-rollup-trigger-btn')).toBeInTheDocument();
    expect(screen.getByTestId('family-rollup-trigger-btn')).toHaveTextContent('Family Office Rollup');
  });

  it('10. Clicking "Family Office Rollup" opens summary modal displaying consolidated net worth and member cards', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('active-account-pill')).toHaveAttribute('data-disabled', 'false');
    });

    fireEvent.click(screen.getByTestId('active-account-pill'));
    fireEvent.click(screen.getByTestId('family-rollup-trigger-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('family-rollup-modal')).toBeInTheDocument();
    });

    expect(userService.getFamilyRollup).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.getByTestId('consolidated-net-worth')).toBeInTheDocument();
    });

    expect(screen.getByText('$500,000')).toBeInTheDocument();
    expect(screen.getByTestId('rollup-member-u-primary-1')).toBeInTheDocument();
    expect(screen.getByTestId('rollup-member-u-child-2')).toBeInTheDocument();

    // Close modal
    fireEvent.click(screen.getByTestId('close-family-rollup-modal'));
    await waitFor(() => {
      expect(screen.queryByTestId('family-rollup-modal')).not.toBeInTheDocument();
    });
  });
});
