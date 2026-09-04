// frontend/src/pages/admin/InsuranceConfigPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, ShieldCheck, ShieldAlert } from 'lucide-react';
import {
  getSocialInsuranceConfigs,
  createSocialInsuranceConfig,
  updateSocialInsuranceConfig,
  deleteSocialInsuranceConfig,
  toggleSocialInsuranceConfig,
} from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import InsuranceConfigCard from './InsuranceConfigCard';
import InsuranceConfigModal from './InsuranceConfigModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import './InsuranceConfigPage.css';

const InsuranceConfigPage = () => {
  const { addToast } = useToast();
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form modal state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [saving, setSaving] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadConfigs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getSocialInsuranceConfigs();
      if (res && res.socialInsuranceConfigs) {
        setConfigs(res.socialInsuranceConfigs);
      } else if (Array.isArray(res)) {
        setConfigs(res);
      } else {
        setConfigs([]);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to fetch social insurance configurations', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  const handleOpenCreateModal = () => {
    setEditingConfig(null);
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (cfg) => {
    setEditingConfig(cfg);
    setFormModalOpen(true);
  };

  const handleSaveConfig = async (formData) => {
    try {
      setSaving(true);
      if (editingConfig) {
        await updateSocialInsuranceConfig(editingConfig._id, formData);
        addToast(`Social insurance configuration for ${formData.year} updated successfully`, 'success');
      } else {
        await createSocialInsuranceConfig(formData);
        addToast(`Social insurance configuration for ${formData.year} created successfully`, 'success');
      }
      setFormModalOpen(false);
      setEditingConfig(null);
      await loadConfigs();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save configuration', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDeleteModal = (cfg) => {
    setConfigToDelete(cfg);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!configToDelete) return;
    try {
      setDeleting(true);
      await deleteSocialInsuranceConfig(configToDelete._id);
      addToast(`${configToDelete.year} Social Insurance configuration deleted successfully`, 'success');
      setDeleteModalOpen(false);
      setConfigToDelete(null);
      await loadConfigs();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete configuration', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (cfg) => {
    try {
      const res = await toggleSocialInsuranceConfig(cfg._id);
      const isNowActive = res.socialInsuranceConfig ? res.socialInsuranceConfig.isActive : !cfg.isActive;
      addToast(
        `${cfg.year} Social Insurance marked as ${isNowActive ? 'Active' : 'Inactive'}`,
        'success'
      );
      setConfigs((prev) =>
        prev.map((item) =>
          item._id === cfg._id ? { ...item, isActive: isNowActive } : item
        )
      );
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to toggle status', 'error');
      loadConfigs();
    }
  };

  return (
    <div className="admin-config-container">
      {/* Header Section */}
      <div className="admin-page-hero">
        <div className="hero-title-group">
          <div className="hero-badge">
            <ShieldAlert size={13} /> Admin System Configuration
          </div>
          <h1 className="hero-main-title">
            <span role="img" aria-label="diamond">🔹</span> Social Insurance Configuration
          </h1>
          <p className="hero-subtitle">
            Manage employee/employer shares and income caps. Updates are applied automatically to Egyptian social insurance calculations.
          </p>
        </div>

        <button
          type="button"
          className="btn-primary-add"
          onClick={handleOpenCreateModal}
          id="btn-add-insurance-config"
        >
          <Plus size={18} />
          <span>Add New Configuration</span>
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="admin-loading-state">
          <div className="loading-spinner-ring"></div>
          <p>Loading social insurance configurations...</p>
        </div>
      ) : configs.length === 0 ? (
        <div className="admin-empty-state-box">
          <ShieldCheck size={48} className="empty-state-icon" />
          <h3 className="empty-state-title">No Social Insurance Configurations Found</h3>
          <p className="empty-state-desc">
            No official insurance deduction rules have been configured yet. Click below to configure rates and caps.
          </p>
          <button
            type="button"
            className="btn-primary-add"
            onClick={handleOpenCreateModal}
          >
            <Plus size={16} />
            <span>Add {new Date().getFullYear()} Social Insurance</span>
          </button>
        </div>
      ) : (
        <div className="admin-cards-container">
          {configs.map((config) => (
            <InsuranceConfigCard
              key={config._id}
              config={config}
              onEdit={handleOpenEditModal}
              onDelete={handleOpenDeleteModal}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}

      {/* Form Modal (Create / Edit) */}
      <InsuranceConfigModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingConfig(null);
        }}
        onSave={handleSaveConfig}
        config={editingConfig}
        saving={saving}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title={`Delete ${configToDelete ? configToDelete.year : ''} Social Insurance`}
        message={
          configToDelete
            ? `Are you sure you want to delete the ${configToDelete.year} Social Insurance configuration? This action cannot be undone.`
            : ''
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setConfigToDelete(null);
        }}
        loading={deleting}
      />
    </div>
  );
};

export default InsuranceConfigPage;
