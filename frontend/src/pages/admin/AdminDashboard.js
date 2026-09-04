// frontend/src/pages/admin/AdminDashboard.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  RefreshCw,
  Shield,
  UserCheck,
  BarChart3,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { getUsers, createUser, deleteUser } from '../../services/adminService';
import { dispatchToast } from '../../services/apiClient';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Current user role from localStorage
  const currentUser = useMemo(() => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : { role: 'viewer' };
    } catch {
      return { role: 'viewer' };
    }
  }, []);

  const isManager = currentUser.role === 'manager';
  const isAdmin = currentUser.role === 'admin';

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

  // Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-header">
        <div>
          <div className="admin-title-group">
            <Users size={32} color="#f87171" />
            <h1 className="admin-page-title">
              {isManager ? 'Manage Your Viewers' : 'User Management'}
            </h1>
          </div>
          <p className="admin-subtitle">
            {isManager
              ? 'View and manage viewers attached to your workspace.'
              : 'Manage system access, register new team members, and oversee role permissions.'}
          </p>
        </div>

        <button onClick={() => setAddModalOpen(true)} className="add-user-btn">
          <UserPlus size={18} />
          <span>{isManager ? 'Add New Viewer' : 'Add New User'}</span>
        </button>
      </div>

      {/* Admin Quick Access Configuration Cards */}
      {isAdmin && (
        <div className="admin-quick-cards-grid">
          <Link to="/admin/tax-brackets" className="admin-quick-card">
            <div className="quick-card-icon-wrapper tax-icon">
              <BarChart3 size={24} />
            </div>
            <div className="quick-card-content">
              <h3 className="quick-card-title">Tax Brackets</h3>
              <p className="quick-card-desc">
                Manage progressive income tax brackets, levels, and personal exemptions
              </p>
            </div>
            <div className="quick-card-arrow">
              <ArrowRight size={18} />
            </div>
          </Link>

          <Link to="/admin/social-insurance" className="admin-quick-card">
            <div className="quick-card-icon-wrapper insurance-icon">
              <ShieldCheck size={24} />
            </div>
            <div className="quick-card-content">
              <h3 className="quick-card-title">Social Insurance</h3>
              <p className="quick-card-desc">
                Manage employee/employer contribution shares and insurable income caps
              </p>
            </div>
            <div className="quick-card-arrow">
              <ArrowRight size={18} />
            </div>
          </Link>
        </div>
      )}

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
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
            <button onClick={() => setSearchInput('')} className="clear-search-btn">
              <X size={16} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            {isManager ? 'Total Viewers:' : 'Total Users:'} <strong>{totalUsers}</strong>
          </span>
          <button
            onClick={fetchUsersList}
            disabled={loading}
            style={{
              background: '#111827',
              border: '1px solid #1e293b',
              color: '#94a3b8',
              borderRadius: '8px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Card & Table */}
      <div className="admin-card">
        {loading ? (
          <div className="loading-spinner" style={{ margin: '40px auto' }}>
            Loading {isManager ? 'viewers' : 'users'}...
          </div>
        ) : users.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">
              <Users size={28} />
            </div>
            <h3 className="admin-empty-title">
              {searchTerm
                ? isManager
                  ? 'No matching viewers found'
                  : 'No matching users found'
                : isManager
                ? "You don't have any Viewers yet"
                : 'No other users registered yet'}
            </h3>
            <p className="admin-empty-desc">
              {searchTerm
                ? `No accounts matched "${searchTerm}". Try a different search term or clear the filter.`
                : isManager
                ? "You don't have any Viewers yet. Click 'Add New Viewer' to invite someone."
                : "Click 'Add New User' to invite someone to your FinStat workspace."}
            </p>
            {searchTerm ? (
              <button onClick={() => setSearchInput('')} className="admin-pagination-btn">
                Clear Search Filter
              </button>
            ) : (
              <button onClick={() => setAddModalOpen(true)} className="add-user-btn">
                <UserPlus size={16} />
                <span>{isManager ? 'Add New Viewer' : 'Add New User'}</span>
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    {isAdmin && <th>Attached To</th>}
                    <th>2FA Status</th>
                    <th>Joined</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, index) => {
                    const rowNumber = (page - 1) * 10 + index + 1;
                    return (
                      <tr key={u._id}>
                        <td style={{ color: '#64748b' }}>{rowNumber}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: 'rgba(248, 113, 113, 0.15)',
                                color: '#f87171',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: '700',
                                fontSize: '0.85rem',
                              }}
                            >
                              {u.username ? u.username.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <span style={{ fontWeight: '600', color: '#f8fafc' }}>
                              {u.username}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span style={{ color: '#94a3b8' }}>
                            {u.email || '—'}
                          </span>
                        </td>
                        <td>
                          <span className={`role-badge role-badge-${u.role || 'viewer'}`}>
                            {u.role || 'viewer'}
                          </span>
                        </td>
                        {isAdmin && (
                          <td>
                            <span style={{ color: '#94a3b8', fontSize: '0.88rem' }}>
                              {u.managedBy ? (
                                <span style={{ color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <UserCheck size={14} /> @{u.managedBy.username || 'Parent'}
                                </span>
                              ) : u.role === 'viewer' ? (
                                <span style={{ color: '#64748b' }}>Self / Unattached</span>
                              ) : (
                                <span style={{ color: '#475569' }}>—</span>
                              )}
                            </span>
                          </td>
                        )}
                        <td>
                          {u.totpEnabled ? (
                            <span className="twofa-badge-on">
                              <CheckCircle2 size={15} /> Enabled
                            </span>
                          ) : (
                            <span className="twofa-badge-off">
                              <XCircle size={15} /> Disabled
                            </span>
                          )}
                        </td>
                        <td>
                          <span style={{ color: '#94a3b8', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Clock size={14} />
                            {formatDate(u.createdAt)}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => {
                              setUserToDelete(u);
                              setDeleteModalOpen(true);
                            }}
                            className="delete-action-btn"
                            title={`Delete ${u.username}`}
                          >
                            <Trash2 size={15} />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="admin-pagination">
              <span className="admin-page-info">
                Page {page} of {totalPages} ({totalUsers} total)
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="admin-pagination-btn"
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="admin-pagination-btn"
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add New User Modal */}
      {addModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={22} color="#f87171" />
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc' }}>
                  {isManager ? 'Register New Viewer' : 'Register New User'}
                </h3>
              </div>
              <button onClick={() => setAddModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.4rem' }}>&times;</button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="form-field-group">
                <label className="form-field-label">Username:</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="e.g. alex_viewer"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="form-field-input"
                    required
                  />
                  <User size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                </div>
              </div>

              <div className="form-field-group">
                <label className="form-field-label">Email Address:</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    placeholder="e.g. alex@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="form-field-input"
                    required
                  />
                  <Mail size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                </div>
              </div>

              <div className="form-field-group">
                <label className="form-field-label">Temporary Password (min 8 chars):</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    placeholder="Create secure password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="form-field-input"
                    required
                  />
                  <Lock size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                </div>
              </div>

              {isAdmin ? (
                <>
                  <div className="form-field-group">
                    <label className="form-field-label">Assigned Role:</label>
                    <select
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
                      <label className="form-field-label">Attach To Parent Account (Admin/Manager):</label>
                      <select
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
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                        This viewer will see the financial data belonging to the selected account.
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="form-field-group">
                  <label className="form-field-label">Assigned Role:</label>
                  <div
                    style={{
                      background: 'rgba(100, 116, 139, 0.1)',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: '#cbd5e1',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Shield size={16} color="#38bdf8" />
                    <span>Viewer (Read-only access attached to your workspace)</span>
                  </div>
                </div>
              )}

              {formError && (
                <div style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '16px' }}>
                  {formError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #334155',
                    color: '#cbd5e1',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="add-user-btn"
                >
                  {formLoading ? 'Creating User...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && userToDelete && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f87171',
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f87171' }}>Confirm User Deletion</h3>
            </div>

            <p style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: '1.6', margin: '0 0 20px' }}>
              Are you sure you want to delete user <strong>{userToDelete.username}</strong>
              {userToDelete.email ? ` (${userToDelete.email})` : ''}?
              <br />
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                This will immediately terminate their active sessions and permanently delete their account. This action cannot be undone.
              </span>
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setUserToDelete(null);
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid #334155',
                  color: '#cbd5e1',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="delete-action-btn"
                style={{ padding: '8px 18px', fontSize: '0.9rem' }}
              >
                {deleteLoading ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
