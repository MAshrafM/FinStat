// frontend/src/pages/admin/TaxConfigPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, BarChart3 } from 'lucide-react';
import {
  getTaxBracketConfigs,
  createTaxBracketConfig,
  updateTaxBracketConfig,
  deleteTaxBracketConfig,
  toggleTaxBracketConfig,
} from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import { EmptyState, Loading, PageHeader } from '../../components/ui';
import TaxConfigCard from './TaxConfigCard';
import TaxConfigModal from './TaxConfigModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import './TaxConfigPage.css';

const TaxConfigPage = () => {
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
      const res = await getTaxBracketConfigs();
      if (res && (res.taxBrackets || res.taxBracketConfigs)) {
        setConfigs(res.taxBrackets || res.taxBracketConfigs);
      } else if (Array.isArray(res)) {
        setConfigs(res);
      } else {
        setConfigs([]);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to fetch tax configurations', 'error');
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
        await updateTaxBracketConfig(editingConfig._id, formData);
        addToast(`Tax brackets for ${formData.year} updated successfully`, 'success');
      } else {
        await createTaxBracketConfig(formData);
        addToast(`Tax brackets for ${formData.year} created successfully`, 'success');
      }
      setFormModalOpen(false);
      setEditingConfig(null);
      await loadConfigs();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save tax configuration', 'error');
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
      await deleteTaxBracketConfig(configToDelete._id);
      addToast(`${configToDelete.year} Tax Brackets configuration deleted successfully`, 'success');
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
      const res = await toggleTaxBracketConfig(cfg._id);
      const isNowActive = res.taxBracket ? res.taxBracket.isActive : !cfg.isActive;
      addToast(
        `${cfg.year} Tax Brackets marked as ${isNowActive ? 'Active' : 'Inactive'}`,
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
    <div className="fs-page admin-config-container">
      <PageHeader
        title="Tax Brackets Configuration"
        subtitle="Manage progressive income tax brackets for each year. Changes take effect across payroll calculations immediately."
        actions={
          <button
            type="button"
            className="fs-btn fs-btn-primary"
            onClick={handleOpenCreateModal}
            id="btn-add-tax-config"
          >
            <Plus size={18} aria-hidden="true" />
            <span>Add New Configuration</span>
          </button>
        }
      />

      {loading ? (
        <div className="admin-config-loading">
          <Loading variant="card" text="Loading tax bracket configurations..." />
        </div>
      ) : configs.length === 0 ? (
        <div className="fs-card">
          <EmptyState
            icon={<BarChart3 size={36} />}
            title="No Tax Configurations Found"
            description="No progressive tax bracket rules have been configured yet. Click below to establish tax rules for Egypt."
            action={
              <button
                type="button"
                className="fs-btn fs-btn-primary"
                onClick={handleOpenCreateModal}
              >
                <Plus size={16} aria-hidden="true" />
                <span>Add {new Date().getFullYear()} Tax Brackets</span>
              </button>
            }
          />
        </div>
      ) : (
        <div className="admin-cards-container">
          {configs.map((config) => (
            <TaxConfigCard
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
      <TaxConfigModal
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
        title={`Delete ${configToDelete ? configToDelete.year : ''} Tax Brackets`}
        message={
          configToDelete
            ? `Are you sure you want to delete the ${configToDelete.year} Tax Brackets configuration? This action cannot be undone.`
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

export default TaxConfigPage;
