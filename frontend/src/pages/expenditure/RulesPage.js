// frontend/src/pages/expenditure/RulesPage.js
import React, { useState, useEffect, useCallback } from 'react';
import ExpenditureSubNav from './ExpenditureSubNav';
import {
  getRules,
  createRule,
  updateRule,
  deleteRule,
  testRule,
} from '../../services/categorizationRuleService';
import { EXPENDITURE_CATEGORIES } from '../../constants/categories';
import { FaPlus, FaFlask, FaPencilAlt, FaTrash, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import ProtectedAction from '../../components/common/ProtectedAction';
import { useCanModify } from '../../context/AuthContext';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Loading, EmptyState, Badge, Button } from '../../components/ui';
import './RulesPage.css';

const RulesPage = () => {
  const canModifyContext = useCanModify();
  const canModify = typeof canModifyContext === 'boolean' ? canModifyContext : canModifyContext?.canModify ?? true;
  const { showToast, addToast } = useToast();
  const notify = showToast || addToast;
  const [ruleToDelete, setRuleToDelete] = useState(null);
  const [rules, setRules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    field: 'description',
    operator: 'contains',
    value: '',
    category: EXPENDITURE_CATEGORIES[0]?.name || 'Shopping & Leisure',
    priority: 0,
    isActive: true,
  });

  // Test Simulator state
  const [testInput, setTestInput] = useState('');
  const [testTargetRule, setTestTargetRule] = useState({
    operator: 'contains',
    value: '',
    category: EXPENDITURE_CATEGORIES[0]?.name || 'Shopping & Leisure',
  });
  const [testResult, setTestResult] = useState(null);

  const fetchRules = useCallback(() => {
    setIsLoading(true);
    getRules(1, 100)
      .then((res) => {
        setRules(res?.data || []);
      })
      .catch((err) => {
        console.error('Failed to load rules:', err);
        setRules([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleOpenCreate = () => {
    setEditingRule(null);
    setFormData({
      name: '',
      field: 'description',
      operator: 'contains',
      value: '',
      category: EXPENDITURE_CATEGORIES[0]?.name || 'Shopping & Leisure',
      priority: 0,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      field: rule.field || 'description',
      operator: rule.operator,
      value: rule.value,
      category: rule.category,
      priority: rule.priority || 0,
      isActive: rule.isActive !== false,
    });
    setIsModalOpen(true);
  };

  const handleSaveRule = async (e) => {
    e.preventDefault();
    if (!canModify) return;
    try {
      if (editingRule) {
        await updateRule(editingRule._id, formData);
      } else {
        await createRule(formData);
      }
      setIsModalOpen(false);
      fetchRules();
    } catch (err) {
      if (notify) notify(err.response?.data?.message || 'Failed to save rule', 'error');
    }
  };

  const handleDeleteRule = (ruleOrId) => {
    if (!canModify) return;
    const ruleObj = typeof ruleOrId === 'object' ? ruleOrId : rules.find((r) => r._id === ruleOrId) || { _id: ruleOrId };
    setRuleToDelete(ruleObj);
  };

  const handleConfirmDeleteRule = async () => {
    if (!ruleToDelete) return;
    try {
      await deleteRule(ruleToDelete._id);
      if (notify) notify('Rule deleted successfully', 'success');
      setRuleToDelete(null);
      fetchRules();
    } catch (err) {
      if (notify) notify('Failed to delete rule', 'error');
    }
  };

  const handleToggleActive = async (rule) => {
    if (!canModify) return;
    try {
      await updateRule(rule._id, { isActive: !rule.isActive });
      fetchRules();
    } catch (err) {
      if (notify) notify('Failed to update rule state', 'error');
    }
  };

  const handleRunTest = async () => {
    if (!testInput) return;
    try {
      const res = await testRule({
        operator: testTargetRule.operator,
        value: testTargetRule.value,
        category: testTargetRule.category,
        sampleText: testInput,
      });
      setTestResult(res);
    } catch (err) {
      console.error('Failed to run test simulator:', err);
    }
  };

  return (
    <div className="fs-page rules-page-container" data-testid="rules-page">
      <PageHeader
        title="Auto-Categorization Rules"
        subtitle="Define rules to automatically classify transactions by description, merchant, or payment method"
        actions={
          <div className="rules-header-actions">
            <Button
              variant="secondary"
              onClick={() => {
                setTestInput('');
                setTestResult(null);
                setIsTestModalOpen(true);
              }}
              data-testid="test-simulator-btn"
            >
              <FaFlask aria-hidden="true" /> Test Simulator
            </Button>
            <ProtectedAction tooltip="View-only access">
              <Button
                variant="primary"
                onClick={handleOpenCreate}
                data-testid="create-rule-btn"
              >
                <FaPlus aria-hidden="true" /> New Rule
              </Button>
            </ProtectedAction>
          </div>
        }
      />

      {/* Navigation tabs */}
      <ExpenditureSubNav />

      {isLoading ? (
        <Loading variant="card" text="Loading categorization rules..." />
      ) : rules.length === 0 ? (
        <EmptyState
          title="No categorization rules configured yet"
          description="Create priority-based rules to automatically tag transactions as they are logged"
          action={
            <ProtectedAction tooltip="View-only access">
              <Button variant="primary" onClick={handleOpenCreate}>
                <FaPlus aria-hidden="true" /> Create Your First Rule
              </Button>
            </ProtectedAction>
          }
        />
      ) : (
        <div className="rules-grid">
          {rules.map((rule) => {
            return (
              <div key={rule._id} className={`rule-card ${rule.isActive === false ? 'inactive' : ''}`}>
                <div>
                  <div className="rule-card-header">
                    <h2 className="rule-card-title">{rule.name}</h2>
                    <Badge tone="neutral" label={`Priority ${rule.priority || 0}`}>
                      Priority {rule.priority || 0}
                    </Badge>
                  </div>

                  <div className="rule-condition">
                    If <span className="condition-field">{rule.field || 'description'}</span>
                    <span className="condition-op">{rule.operator}</span>
                    <span className="condition-val">"{rule.value}"</span>
                    <div className="rule-target-cat">
                      <span>Set category:</span>
                      <span className="cat-pill">
                        {rule.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rule-card-footer">
                  <ProtectedAction tooltip="View-only access">
                    <label className="rule-toggle-label">
                      <input
                        type="checkbox"
                        checked={rule.isActive !== false}
                        onChange={() => handleToggleActive(rule)}
                        aria-label={`Toggle active state for rule ${rule.name}`}
                      />
                      <span>{rule.isActive !== false ? 'Active' : 'Disabled'}</span>
                    </label>
                  </ProtectedAction>

                  <div className="rule-actions">
                    <button
                      type="button"
                      className="rule-action-btn"
                      title="Test this rule"
                      aria-label={`Test rule ${rule.name}`}
                      onClick={() => {
                        setTestTargetRule({
                          operator: rule.operator,
                          value: rule.value,
                          category: rule.category,
                        });
                        setTestInput('');
                        setTestResult(null);
                        setIsTestModalOpen(true);
                      }}
                    >
                      <FaFlask aria-hidden="true" />
                    </button>
                    <ProtectedAction tooltip="View-only access">
                      <button
                        type="button"
                        className="rule-action-btn"
                        title="Edit rule"
                        aria-label={`Edit rule ${rule.name}`}
                        onClick={() => handleOpenEdit(rule)}
                      >
                        <FaPencilAlt aria-hidden="true" />
                      </button>
                    </ProtectedAction>
                    <ProtectedAction tooltip="View-only access">
                      <button
                        type="button"
                        className="rule-action-btn delete"
                        title="Delete rule"
                        aria-label={`Delete rule ${rule.name}`}
                        onClick={() => handleDeleteRule(rule._id)}
                      >
                        <FaTrash aria-hidden="true" />
                      </button>
                    </ProtectedAction>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={() => setIsModalOpen(false)}
          onKeyDown={(e) => { if (e.key === 'Escape') setIsModalOpen(false); }}
        >
          <div
            className="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-rule-title"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="modal-rule-title">{editingRule ? 'Edit Rule' : 'Create Categorization Rule'}</h2>
              <button
                type="button"
                className="modal-close-btn"
                aria-label="Close modal"
                onClick={() => setIsModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveRule}>
              <div className="modal-body">
                <div className="form-row">
                  <label htmlFor="rule-name-input">Rule Name</label>
                  <input
                    id="rule-name-input"
                    type="text"
                    required
                    placeholder="e.g. Amazon to Shopping"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <label htmlFor="rule-field-select">Target Field</label>
                  <select
                    id="rule-field-select"
                    value={formData.field}
                    onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                  >
                    <option value="description">Description</option>
                    <option value="merchant">Merchant</option>
                    <option value="paymentMethod">Payment Method</option>
                  </select>
                </div>

                <div className="form-row">
                  <label htmlFor="rule-operator-select">Operator</label>
                  <select
                    id="rule-operator-select"
                    value={formData.operator}
                    onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                  >
                    <option value="contains">Contains</option>
                    <option value="equals">Equals</option>
                    <option value="startsWith">Starts With</option>
                    <option value="endsWith">Ends With</option>
                    <option value="regex">Regular Expression</option>
                  </select>
                </div>

                <div className="form-row">
                  <label htmlFor="rule-value-input">Match Value</label>
                  <input
                    id="rule-value-input"
                    type="text"
                    required
                    placeholder="e.g. amazon or uber"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <label htmlFor="rule-category-select">Assign Category</label>
                  <select
                    id="rule-category-select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {EXPENDITURE_CATEGORIES.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <label htmlFor="rule-priority-input">Priority (Higher priority rules evaluate first)</label>
                  <input
                    id="rule-priority-input"
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <ProtectedAction tooltip="View-only access">
                  <Button type="submit" variant="primary">
                    {editingRule ? 'Update Rule' : 'Create Rule'}
                  </Button>
                </ProtectedAction>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(ruleToDelete)}
        title="Delete Categorization Rule"
        message={`Are you sure you want to delete the rule "${ruleToDelete?.name || ''}"?`}
        confirmText="Delete Rule"
        variant="danger"
        onConfirm={handleConfirmDeleteRule}
        onCancel={() => setRuleToDelete(null)}
      />

      {/* Test Rule Simulator Modal */}
      {isTestModalOpen && (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={() => setIsTestModalOpen(false)}
          onKeyDown={(e) => { if (e.key === 'Escape') setIsTestModalOpen(false); }}
        >
          <div
            className="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-test-title"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="modal-test-title">Rule Test Simulator</h2>
              <button
                type="button"
                className="modal-close-btn"
                aria-label="Close test simulator"
                onClick={() => setIsTestModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <label htmlFor="test-operator-select">Operator</label>
                <select
                  id="test-operator-select"
                  value={testTargetRule.operator}
                  onChange={(e) => setTestTargetRule({ ...testTargetRule, operator: e.target.value })}
                >
                  <option value="contains">Contains</option>
                  <option value="equals">Equals</option>
                  <option value="startsWith">Starts With</option>
                  <option value="endsWith">Ends With</option>
                  <option value="regex">Regular Expression</option>
                </select>
              </div>

              <div className="form-row">
                <label htmlFor="test-value-input">Value Pattern</label>
                <input
                  id="test-value-input"
                  type="text"
                  placeholder="e.g. amazon"
                  value={testTargetRule.value}
                  onChange={(e) => setTestTargetRule({ ...testTargetRule, value: e.target.value })}
                />
              </div>

              <div className="form-row">
                <label htmlFor="test-category-select">Assigned Category</label>
                <select
                  id="test-category-select"
                  value={testTargetRule.category}
                  onChange={(e) => setTestTargetRule({ ...testTargetRule, category: e.target.value })}
                >
                  {EXPENDITURE_CATEGORIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label htmlFor="test-sample-input">Sample Text to Test</label>
                <input
                  id="test-sample-input"
                  type="text"
                  placeholder="e.g. Amazon Prime Video #4491"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                />
              </div>

              <div className="sim-run-actions">
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleRunTest}
                >
                  Run Match Simulation
                </Button>
              </div>

              {testResult && (
                <div className={`test-result-box ${testResult.matched ? 'match' : 'no-match'}`}>
                  {testResult.matched ? (
                    <>
                      <FaCheckCircle className="test-status-icon fs-tone-positive" aria-hidden="true" />
                      <div>
                        <strong>Match Found!</strong>
                        <div>Auto-assigned Category: <strong>{testResult.category}</strong></div>
                      </div>
                    </>
                  ) : (
                    <>
                      <FaTimesCircle className="test-status-icon fs-tone-negative" aria-hidden="true" />
                      <div>
                        <strong>No Match</strong>
                        <div>Rule pattern does not match the sample text.</div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <Button type="button" variant="secondary" onClick={() => setIsTestModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RulesPage;
