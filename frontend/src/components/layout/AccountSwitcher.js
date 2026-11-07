// frontend/src/components/layout/AccountSwitcher.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronUp, Users, ShieldAlert, ArrowLeftRight, X, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getSwitchableAccounts, getFamilyRollup } from '../../services/userService';
import './AccountSwitcher.css';

const formatCurrency = (val) => {
  const num = Number(val || 0);
  return `$${num.toLocaleString()}`;
};

const AccountSwitcher = ({ isExpanded = true }) => {
  const {
    user,
    isDelegatedSession,
    originalUser,
    switchAccount,
    switchBackToPrimary,
  } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  // Rollup Modal State
  const [showRollupModal, setShowRollupModal] = useState(false);
  const [rollupData, setRollupData] = useState(null);
  const [isRollupLoading, setIsRollupLoading] = useState(false);

  const containerRef = useRef(null);

  // Fetch switchable accounts
  const loadAccounts = useCallback(async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const res = await getSwitchableAccounts();
      if (res && res.accounts) {
        setAccounts(res.accounts);
      }
    } catch (err) {
      console.error('[AccountSwitcher] Failed to fetch switchable accounts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts, user?.id, isDelegatedSession]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Has other switchable accounts
  const hasMultipleAccounts = accounts.length > 1;

  // Handle switching
  const handleSelectAccount = async (targetId) => {
    if (targetId === user?.id) {
      setIsOpen(false);
      return;
    }
    try {
      setIsSwitching(true);
      await switchAccount(targetId);
      setIsOpen(false);
    } catch (err) {
      console.error('[AccountSwitcher] Account switch failed:', err);
    } finally {
      setIsSwitching(false);
    }
  };

  // Handle return to primary
  const handleSwitchBack = async () => {
    try {
      setIsSwitching(true);
      await switchBackToPrimary();
      setIsOpen(false);
    } catch (err) {
      console.error('[AccountSwitcher] Return to primary failed:', err);
    } finally {
      setIsSwitching(false);
    }
  };

  // Open Family Office Rollup Modal
  const handleOpenRollup = async () => {
    setIsOpen(false);
    setShowRollupModal(true);
    try {
      setIsRollupLoading(true);
      const res = await getFamilyRollup();
      setRollupData(res);
    } catch (err) {
      console.error('[AccountSwitcher] Failed to load family rollup:', err);
    } finally {
      setIsRollupLoading(false);
    }
  };

  const getRelationshipBadgeLabel = (acc) => {
    if (acc.isSelf || acc.relationship === 'self') return 'Primary';
    if (acc.isManaged || acc.relationship === 'dependent') return 'Dependent';
    if (acc.isDelegated) return 'Delegated';
    return acc.relationship || 'Account';
  };

  const getRelationshipClass = (acc) => {
    if (acc.isSelf || acc.relationship === 'self') return 'rel-self';
    if (acc.isManaged || acc.relationship === 'dependent') return 'rel-dependent';
    return 'rel-delegated';
  };

  return (
    <div className="account-switcher-container" ref={containerRef}>
      {/* 1. Amber Persistent Banner on Delegated Session */}
      {isDelegatedSession && (
        <div className="delegation-banner" data-testid="delegation-banner">
          <div className="delegation-banner-info">
            <span className="delegation-banner-badge">Delegated Session</span>
          </div>
          <button
            type="button"
            className="delegation-banner-switchback-btn"
            data-testid="switch-back-btn"
            onClick={handleSwitchBack}
            disabled={isSwitching}
            title={`Return to original account`}
          >
            Switch back
          </button>
        </div>
      )}

      {/* 2. Switcher Trigger Button */}
      <div
        className="account-switcher-pill"
        data-testid="active-account-pill"
        data-disabled={!hasMultipleAccounts}
        onClick={() => {
          if (hasMultipleAccounts) {
            setIsOpen((prev) => !prev);
          }
        }}
      >
        <div className="account-switcher-avatar">
          {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
        </div>
        {isExpanded && (
          <div className="account-switcher-details">
            <span className="account-switcher-name" data-testid="active-account-username">
              {user?.username || 'Account'}
            </span>
            <div className="account-switcher-meta">
              <span
                className={`account-role-badge role-${user?.role || 'viewer'}`}
                data-testid="active-account-role"
              >
                {user?.role || 'viewer'}
              </span>
            </div>
          </div>
        )}
        {isExpanded && hasMultipleAccounts && (
          <ChevronUp
            size={16}
            className={`account-switcher-chevron ${isOpen ? 'rotated' : ''}`}
            data-testid="account-switcher-chevron"
          />
        )}
      </div>

      {/* 3. Popover Account Dropdown */}
      {isOpen && (
        <div className="account-switcher-dropdown" data-testid="account-switcher-dropdown">
          <div className="account-switcher-section-title">Switch Account</div>
          <div className="account-switcher-list">
            {accounts.map((acc) => {
              const isCurrent = acc.id === user?.id || acc.isCurrent;
              return (
                <div
                  key={acc.id}
                  className={`account-row ${isCurrent ? 'active' : ''}`}
                  data-testid={`switch-account-option-${acc.id}`}
                  onClick={() => handleSelectAccount(acc.id)}
                >
                  <div className="account-row-info">
                    <span className="account-row-handle">@{acc.username}</span>
                    <span
                      className={`relationship-badge ${getRelationshipClass(acc)}`}
                      data-testid={`badge-relationship-${acc.id}`}
                    >
                      {getRelationshipBadgeLabel(acc)}
                    </span>
                  </div>
                  {isCurrent && <span style={{ fontSize: '11px', color: '#60a5fa' }}>Active</span>}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className="family-rollup-btn"
            data-testid="family-rollup-trigger-btn"
            onClick={handleOpenRollup}
          >
            <Users size={14} />
            <span>Family Office Rollup</span>
          </button>
        </div>
      )}

      {/* 4. Family Office Rollup Modal */}
      {showRollupModal && (
        <div className="family-rollup-modal-backdrop">
          <div className="family-rollup-modal-content" data-testid="family-rollup-modal">
            <div className="family-rollup-header">
              <div className="family-rollup-title">
                <TrendingUp size={20} color="#38bdf8" />
                <span>Family Office Consolidated Rollup</span>
              </div>
              <button
                type="button"
                className="family-rollup-close-btn"
                data-testid="close-family-rollup-modal"
                onClick={() => setShowRollupModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="family-rollup-body">
              {isRollupLoading ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                  Loading family consolidated metrics...
                </div>
              ) : (
                <>
                  <div className="family-rollup-metrics-grid">
                    <div className="rollup-metric-card">
                      <div className="rollup-metric-label">Consolidated Net Worth</div>
                      <div
                        className="rollup-metric-value metric-networth"
                        data-testid="consolidated-net-worth"
                      >
                        {formatCurrency(rollupData?.consolidatedNetWorth)}
                      </div>
                    </div>
                    <div className="rollup-metric-card">
                      <div className="rollup-metric-label">Consolidated Assets</div>
                      <div className="rollup-metric-value metric-assets">
                        {formatCurrency(rollupData?.consolidatedAssets)}
                      </div>
                    </div>
                    <div className="rollup-metric-card">
                      <div className="rollup-metric-label">Consolidated Liabilities</div>
                      <div className="rollup-metric-value metric-debts">
                        {formatCurrency(rollupData?.consolidatedDebts)}
                      </div>
                    </div>
                  </div>

                  <div className="family-members-section">
                    <div className="account-switcher-section-title">
                      Portfolio Members ({rollupData?.members?.length || 0})
                    </div>
                    <div className="family-members-list">
                      {rollupData?.members?.map((member) => (
                        <div
                          key={member.userId}
                          className="rollup-member-card"
                          data-testid={`rollup-member-${member.userId}`}
                        >
                          <div className="member-card-left">
                            <span className="member-card-title">
                              @{member.username}
                              <span
                                className={`relationship-badge ${
                                  member.isSelf
                                    ? 'rel-self'
                                    : member.isManaged
                                    ? 'rel-dependent'
                                    : 'rel-delegated'
                                }`}
                              >
                                {member.isSelf
                                  ? 'Primary'
                                  : member.isManaged
                                  ? 'Dependent'
                                  : 'Delegated'}
                              </span>
                            </span>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                              Holdings: {member.holdingsCount || 0} items
                            </span>
                          </div>
                          <div className="member-card-right">
                            <div className="member-networth-val">
                              {formatCurrency(member.netWorth)}
                            </div>
                            <span style={{ fontSize: '10px', color: '#64748b' }}>
                              Assets {formatCurrency(member.totalAssets)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSwitcher;
