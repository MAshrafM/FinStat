// frontend/src/pages/admin/AdminDashboard.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  X,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Mail,
  User,
  Lock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Shield,
  UserCheck,
  BarChart3,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { getUsers, createUser, deleteUser } from '../../services/adminService';
import { dispatchToast } from '../../services/apiClient';
import ProtectedAction from '../../components/common/ProtectedAction';
import { useAuth } from '../../context/AuthContext';
import { Badge, EmptyState, Loading, PageHeader } from '../../components/ui';
import { useModalFocus } from './useModalFocus';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user: currentUser, isManager, isAdmin, isViewer } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Guarded D19 mobile viewport state
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(max-width: 768px)').matches
      : false
  );
  const [expandedUserIds, setExpandedUserIds] = useState({});

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const mql = window.matchMedia('(max-width: 768px)');
    const onChange = (e) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    }
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, []);

  // Search State with 300ms debounce
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Add User Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'viewer',
    parentId: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const addModalRef = useRef(null);

  // Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const deleteModalRef = useRef(null);

  const closeAddModal = useCallback(() => setAddModalOpen(false), []);
  const closeDeleteModal = useCallback(() => {
    setDeleteModalOpen(false);
    setUserToDelete(null);
  }, []);

  useModalFocus(addModalOpen, closeAddModal, addModalRef);
  useModalFocus(deleteModalOpen && Boolean(userToDelete), closeDeleteModal, deleteModalRef);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(searchInput);
      setPage(1);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchInput]);

  // Fetch users
  const fetchUsersList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUsers(page, 10, searchTerm);
      if (data.users) {
        setUsers(data.users);
        setTotalPages(data.totalPages || 1);
        setTotalUsers(data.totalUsers || 0);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    fetchUsersList();
  }, [fetchUsersList]);

  // Potential parents for Admin assigning Viewers (Admin itself + Managers/Admins in user list)
  const availableParents = useMemo(() => {
    const parents = [];
    if (currentUser?.id || currentUser?._id) {
      parents.push({
        id: currentUser.id || currentUser._id,
        username: `${currentUser.username || 'You'} (${currentUser.role || 'Admin'})`,
      });
    }
    users.forEach((u) => {
      if (u.role === 'admin' || u.role === 'manager') {
        if (!parents.some((p) => p.id === u._id)) {
          parents.push({
            id: u._id,
            username: `${u.username} (${u.role})`,
          });
        }
      }
    });
    return parents;
  }, [currentUser, users]);

  // Handle Add User Form Submission
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (isViewer) return;
    setFormError('');

    if (!formData.username.trim() || formData.username.trim().length < 3) {
      setFormError('Username must be at least 3 characters.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!formData.password || formData.password.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    setFormLoading(true);

    try {
      const payload = {
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: isManager ? 'viewer' : formData.role,
      };

      if (isAdmin && formData.role === 'viewer' && formData.parentId) {
        payload.parentId = formData.parentId;
      }

      const data = await createUser(payload);

      dispatchToast(
        `User ${data.user?.username || formData.username} registered successfully!`,
        'success'
      );
      setAddModalOpen(false);
      setFormData({ username: '', email: '', password: '', role: 'viewer', parentId: '' });
      fetchUsersList();
    } catch (err) {
      setFormError(err.message || 'Failed to create user.');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle User Deletion
  const handleConfirmDelete = async () => {
    if (isViewer) return;
    if (!userToDelete) return;
    setDeleteLoading(true);

    try {
      await deleteUser(userToDelete._id);
      dispatchToast(`User ${userToDelete.username} deleted successfully`, 'success');
      setDeleteModalOpen(false);
      setUserToDelete(null);
      fetchUsersList();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const toggleExpandUser = (id) => {
    setExpandedUserIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderAttachedTo = (u) => {
    if (u.managedBy) {
      return (
        <span className="admin-attached-badge">
          <UserCheck size={14} aria-hidden="true" /> @{u.managedBy.username || 'Parent'}
        </span>
      );
    }
    if (u.role === 'viewer') {
      return <span className="admin-muted-text">Self / Unattached</span>;
    }
    return <span className="admin-muted-text">—</span>;
  };

  return (
    <div className="fs-page admin-page-container">
      <PageHeader
        title={isManager ? 'Manage Your Viewers' : 'User Management'}
        subtitle={
          isManager
            ? 'View and manage viewers attached to your workspace.'
            : 'Manage system access, register new team members, and oversee role permissions.'
        }
        actions={
          <ProtectedAction tooltip="View-only access">
            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="fs-btn fs-btn-primary"
            >
              <UserPlus size={18} aria-hidden="true" />
              <span>{isManager ? 'Add New Viewer' : 'Add New User'}</span>
            </button>
          </ProtectedAction>
        }
      />

      {/* Admin Quick Access Configuration Cards */}
      {isAdmin && (
        <div className="admin-quick-cards-grid">
          <Link to="/admin/tax-brackets" className="fs-card admin-quick-card">
            <div className="quick-card-icon-wrapper">
              <BarChart3 size={22} aria-hidden="true" />
            </div>
            <div className="quick-card-content">
              <h2 className="quick-card-title">Tax Brackets</h2>
              <p className="quick-card-desc">
                Manage progressive income tax brackets, levels, and personal exemptions
              </p>
            </div>
            <div className="quick-card-arrow">
              <ArrowRight size={18} aria-hidden="true" />
            </div>
          </Link>

          <Link to="/admin/social-insurance" className="fs-card admin-quick-card">
            <div className="quick-card-icon-wrapper">
              <ShieldCheck size={22} aria-hidden="true" />
            </div>
            <div className="quick-card-content">
              <h2 className="quick-card-title">Social Insurance</h2>
              <p className="quick-card-desc">
                Manage employee/employer contribution shares and insurable income caps
              </p>
            </div>
            <div className="quick-card-arrow">
              <ArrowRight size={18} aria-hidden="true" />
            </div>
          </Link>
        </div>
      )}

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" aria-hidden="true" />
          <input
            type="text"
            aria-label={isManager ? 'Search viewers' : 'Search users'}
            placeholder={
              isManager
                ? 'Search viewers by username or email...'
                : 'Search by username or email...'
            }
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="search-input"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="clear-search-btn"
              aria-label="Clear search"
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="admin-toolbar-meta">
          <span className="admin-total-count">
            {isManager ? 'Total Viewers:' : 'Total Users:'}{' '}
            <strong className="fs-num">{totalUsers}</strong>
          </span>
          <button
            type="button"
            onClick={fetchUsersList}
            disabled={loading}
            className="fs-btn fs-btn-secondary admin-refresh-btn"
            aria-label="Refresh users"
          >
            <RefreshCw size={14} aria-hidden="true" />
            <span>{loading ? 'Refreshing' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Card & Table / Mobile Cards */}
      <div className="fs-card admin-card">
        {loading ? (
          <div className="admin-loading-pad">
            <Loading
              variant="table"
              rows={5}
              text={`Loading ${isManager ? 'viewers' : 'users'}...`}
            />
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={<Users size={28} />}
            title={
              searchTerm
                ? isManager
                  ? 'No matching viewers found'
                  : 'No matching users found'
                : isManager
                  ? "You don't have any Viewers yet"
                  : 'No other users registered yet'
            }
            description={
              searchTerm
                ? `No accounts matched "${searchTerm}". Try a different search term or clear the filter.`
                : isManager
                  ? "You don't have any Viewers yet. Click 'Add New Viewer' to invite someone."
                  : "Click 'Add New User' to invite someone to your FinStat workspace."
            }
            action={
              searchTerm ? (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="fs-btn fs-btn-secondary"
                >
                  Clear Search Filter
                </button>
              ) : (
                <ProtectedAction tooltip="View-only access">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(true)}
                    className="fs-btn fs-btn-primary"
                  >
                    <UserPlus size={16} aria-hidden="true" />
                    <span>{isManager ? 'Add New Viewer' : 'Add New User'}</span>
                  </button>
                </ProtectedAction>
              )
            }
          />
        ) : (
          <>
            {!isMobile ? (
              <div className="admin-table-wrap" data-testid="admin-users-table">
                <table className="fs-table admin-table">
                  <thead>
                    <tr>
                      <th scope="col" className="fs-num">#</th>
                      <th scope="col">User</th>
                      <th scope="col">Email</th>
                      <th scope="col">Role</th>
                      {isAdmin && <th scope="col">Attached To</th>}
                      <th scope="col">2FA Status</th>
                      <th scope="col">Joined</th>
                      <th scope="col" className="admin-actions-col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, index) => {
                      const rowNumber = (page - 1) * 10 + index + 1;
                      return (
                        <tr key={u._id}>
                          <td className="fs-num admin-row-num">{rowNumber}</td>
                          <td>
                            <div className="admin-user-cell">
                              <div className="admin-user-avatar" aria-hidden="true">
                                {u.username ? u.username.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <span className="admin-username-text">{u.username}</span>
                            </div>
                          </td>
                          <td className="admin-email-cell">{u.email || '—'}</td>
                          <td>
                            <Badge>{u.role || 'viewer'}</Badge>
                          </td>
                          {isAdmin && <td>{renderAttachedTo(u)}</td>}
                          <td>
                            {u.totpEnabled ? (
                              <Badge label="2FA Enabled">
                                <CheckCircle2 size={13} aria-hidden="true" />
                                <span>Enabled</span>
                              </Badge>
                            ) : (
                              <Badge tone="warning" label="2FA Disabled">
                                <XCircle size={13} aria-hidden="true" />
                                <span>Disabled</span>
                              </Badge>
                            )}
                          </td>
                          <td>
                            <span className="admin-date-cell">
                              <Clock size={14} aria-hidden="true" />
                              <time data-visual-mask="true" className="fs-num">
                                {formatDate(u.createdAt)}
                              </time>
                            </span>
                          </td>
                          <td className="admin-actions-col">
                            <ProtectedAction tooltip="View-only access">
                              <button
                                type="button"
                                onClick={() => {
                                  setUserToDelete(u);
                                  setDeleteModalOpen(true);
                                }}
                                className="fs-btn fs-btn-ghost admin-delete-trigger"
                                title={`Delete ${u.username}`}
                                aria-label={`Delete ${u.username}`}
                              >
                                <Trash2 size={15} aria-hidden="true" />
                                <span>Delete</span>
                              </button>
                            </ProtectedAction>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="admin-mobile-cards" data-testid="admin-users-mobile-cards">
                {users.map((u) => {
                  const isExpanded = Boolean(expandedUserIds[u._id]);
                  return (
                    <div key={u._id} className="admin-mobile-card">
                      <div className="admin-mobile-card-top">
                        <div className="admin-user-cell">
                          <div className="admin-user-avatar" aria-hidden="true">
                            {u.username ? u.username.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="admin-mobile-identity">
                            <span className="admin-username-text">{u.username}</span>
                            <div className="admin-mobile-badges">
                              <Badge>{u.role || 'viewer'}</Badge>
                              {u.totpEnabled ? (
                                <Badge label="2FA Enabled">2FA On</Badge>
                              ) : (
                                <Badge tone="warning" label="2FA Disabled">2FA Off</Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="fs-btn fs-btn-ghost admin-expand-btn"
                          onClick={() => toggleExpandUser(u._id)}
                          aria-expanded={isExpanded}
                          aria-label={isExpanded ? `Collapse ${u.username}` : `Expand ${u.username}`}
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="admin-mobile-card-details">
                          <div className="admin-mobile-detail-row">
                            <span className="admin-mobile-detail-label">Email</span>
                            <span className="admin-mobile-detail-value">{u.email || '—'}</span>
                          </div>
                          {isAdmin && (
                            <div className="admin-mobile-detail-row">
                              <span className="admin-mobile-detail-label">Attached To</span>
                              <span className="admin-mobile-detail-value">{renderAttachedTo(u)}</span>
                            </div>
                          )}
                          <div className="admin-mobile-detail-row">
                            <span className="admin-mobile-detail-label">Joined</span>
                            <time data-visual-mask="true" className="fs-num admin-mobile-detail-value">
                              {formatDate(u.createdAt)}
                            </time>
                          </div>
                          <div className="admin-mobile-card-actions">
                            <ProtectedAction tooltip="View-only access">
                              <button
                                type="button"
                                onClick={() => {
                                  setUserToDelete(u);
                                  setDeleteModalOpen(true);
                                }}
                                className="fs-btn fs-btn-secondary admin-mobile-delete-btn"
                                aria-label={`Delete ${u.username}`}
                              >
                                <Trash2 size={15} aria-hidden="true" />
                                <span>Delete User</span>
                              </button>
                            </ProtectedAction>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            <div className="admin-pagination">
              <span className="admin-page-info fs-num">
                Page {page} of {totalPages} ({totalUsers} total)
              </span>
              <div className="admin-pagination-actions">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="fs-btn fs-btn-secondary"
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="fs-btn fs-btn-secondary"
                >
                  <span>Next</span>
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add New User Modal */}
      {addModalOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-user-modal-title"
        >
          <div className="modal-content admin-modal-card" ref={addModalRef}>
            <div className="admin-modal-header">
              <div className="admin-modal-title-group">
                <UserPlus size={20} aria-hidden="true" />
                <h3 id="add-user-modal-title" className="admin-modal-title">
                  {isManager ? 'Register New Viewer' : 'Register New User'}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeAddModal}
                className="admin-modal-close-btn"
                aria-label="Close modal"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="form-field-group">
                <label className="form-field-label" htmlFor="add-user-username">
                  Username
                </label>
                <div className="admin-input-icon-wrap">
                  <input
                    id="add-user-username"
                    type="text"
                    placeholder="e.g. alex_viewer"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="form-field-input"
                    required
                  />
                  <User size={16} className="admin-input-trailing-icon" aria-hidden="true" />
                </div>
              </div>

              <div className="form-field-group">
                <label className="form-field-label" htmlFor="add-user-email">
                  Email Address
                </label>
                <div className="admin-input-icon-wrap">
                  <input
                    id="add-user-email"
                    type="email"
                    placeholder="e.g. alex@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="form-field-input"
                    required
                  />
                  <Mail size={16} className="admin-input-trailing-icon" aria-hidden="true" />
                </div>
              </div>

              <div className="form-field-group">
                <label className="form-field-label" htmlFor="add-user-password">
                  Temporary Password (min 8 chars)
                </label>
                <div className="admin-input-icon-wrap">
                  <input
                    id="add-user-password"
                    type="password"
                    placeholder="Create secure password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="form-field-input"
                    required
                  />
                  <Lock size={16} className="admin-input-trailing-icon" aria-hidden="true" />
                </div>
              </div>

              {isAdmin ? (
                <>
                  <div className="form-field-group">
                    <label className="form-field-label" htmlFor="add-user-role">
                      Assigned Role
                    </label>
                    <select
                      id="add-user-role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="form-field-select"
                    >
                      <option value="viewer">Viewer (Read-Only access)</option>
                      <option value="manager">Manager (Create & Edit financial records)</option>
                      <option value="admin">Admin (Full system & user management)</option>
                    </select>
                  </div>

                  {formData.role === 'viewer' && (
                    <div className="form-field-group">
                      <label className="form-field-label" htmlFor="add-user-parent">
                        Attach To Parent Account (Admin/Manager)
                      </label>
                      <select
                        id="add-user-parent"
                        value={formData.parentId}
                        onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                        className="form-field-select"
                      >
                        <option value="">Default (Your own admin data)</option>
                        {availableParents.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.username}
                          </option>
                        ))}
                      </select>
                      <span className="admin-field-hint">
                        This viewer will see the financial data belonging to the selected account.
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="form-field-group">
                  <span className="form-field-label">Assigned Role</span>
                  <div className="admin-readonly-role-box">
                    <Shield size={16} aria-hidden="true" />
                    <span>Viewer (Read-only access attached to your workspace)</span>
                  </div>
                </div>
              )}

              {formError && (
                <div className="admin-form-error" role="alert">
                  {formError}
                </div>
              )}

              <div className="admin-modal-actions">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="fs-btn fs-btn-secondary"
                >
                  Cancel
                </button>
                <ProtectedAction tooltip="View-only access">
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="fs-btn fs-btn-primary"
                  >
                    {formLoading ? 'Creating User...' : 'Create Account'}
                  </button>
                </ProtectedAction>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && userToDelete && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-user-modal-title"
        >
          <div className="modal-content admin-modal-card" ref={deleteModalRef}>
            <div className="admin-delete-modal-head">
              <div className="admin-delete-icon-box" aria-hidden="true">
                <AlertTriangle size={20} />
              </div>
              <h3 id="delete-user-modal-title" className="admin-modal-title">
                Confirm User Deletion
              </h3>
            </div>

            <p className="admin-delete-modal-body">
              Are you sure you want to delete user <strong>{userToDelete.username}</strong>
              {userToDelete.email ? ` (${userToDelete.email})` : ''}?
              <span className="admin-delete-modal-note">
                This will immediately terminate their active sessions and permanently delete their account. This action cannot be undone.
              </span>
            </p>

            <div className="admin-modal-actions">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="fs-btn fs-btn-secondary"
              >
                Cancel
              </button>
              <ProtectedAction tooltip="View-only access">
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleteLoading}
                  className="fs-btn fs-btn-danger"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete User'}
                </button>
              </ProtectedAction>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
