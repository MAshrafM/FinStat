// frontend/src/pages/expenditure/RulesPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  getRules,
  createRule,
  updateRule,
  deleteRule,
  testRule,
} from '../../services/categorizationRuleService';
import { EXPENDITURE_CATEGORIES } from '../../constants/categories';
import { FaPlus, FaFlask, FaPencilAlt, FaTrash, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import './RulesPage.css';

const RulesPage = () => {
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
    try {
      if (editingRule) {
        await updateRule(editingRule._id, formData);
      } else {
        await createRule(formData);
      }
      setIsModalOpen(false);
      fetchRules();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save rule');
    }
  };

  const handleDeleteRule = async (id) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      try {
        await deleteRule(id);
        fetchRules();
      } catch (err) {
        alert('Failed to delete rule');
      }
    }
  };

  const handleToggleActive = async (rule) => {
    try {
      await updateRule(rule._id, { isActive: !rule.isActive });
      fetchRules();
    } catch (err) {
      alert('Failed to update rule state');
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

  const getCategoryColor = (catName) => {
    const found = EXPENDITURE_CATEGORIES.find((c) => c.name === catName);
    return found ? found.color : '#6b7280';
  };

  return (
    <div className="rules-page-container">
      {/* Navigation tabs */}
      <div className="rules-nav-tabs">
        <Link to="/expenditures" className="rules-nav-link">
          Expenditure Log
        </Link>
        <Link to="/expenditures/rules" className="rules-nav-link active">
          Auto-Categorization Rules
        </Link>
        <Link to="/expenditures/budgets" className="rules-nav-link">
          Budget Tracker
        </Link>
        <Link to="/expenditures/recurring" className="rules-nav-link">
          Recurring Detection
        </Link>
      </div>

      <div className="rules-header">
        <div className="rules-header-titles">
          <h1>Auto-Categorization Rules</h1>
          <p>Define rules to automatically classify transactions by description, merchant, or payment method.</p>
        </div>
        <div className="rules-header-actions">
          <button
            className="btn-secondary"
            onClick={() => {
              setTestInput('');
              setTestResult(null);
              setIsTestModalOpen(true);
            }}
          >
            <FaFlask /> Test Simulator
          </button>
          <button className="btn-primary" onClick={handleOpenCreate}>
            <FaPlus /> New Rule
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Loading rules...</div>
      ) : rules.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem',
            background: 'white',
            borderRadius: '12px',
            border: '1px dashed #d1d5db',
            color: '#6b7280',
          }}
        >
          <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>No categorization rules configured yet.</p>
          <button className="btn-primary" onClick={handleOpenCreate}>
            <FaPlus /> Create Your First Rule
          </button>
        </div>
      ) : (
        <div className="rules-grid">
          {rules.map((rule) => {
            const catColor = getCategoryColor(rule.category);
            return (
              <div key={rule._id} className={`rule-card ${rule.isActive === false ? 'inactive' : ''}`}>
                <div>
                  <div className="rule-card-header">
                    <h3 className="rule-card-title">{rule.name}</h3>
                    <span className="priority-badge">Priority {rule.priority || 0}</span>
                  </div>

                  <div className="rule-condition">
                    If <span className="condition-field">{rule.field || 'description'}</span>
                    <span className="condition-op">{rule.operator}</span>
                    <span className="condition-val">"{rule.value}"</span>
                    <div className="rule-target-cat">
                      <span>Set category:</span>
                      <span className="cat-pill" style={{ backgroundColor: catColor }}>
                        {rule.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rule-card-footer">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      checked={rule.isActive !== false}
                      onChange={() => handleToggleActive(rule)}
                    />
                    {rule.isActive !== false ? 'Active' : 'Disabled'}
                  </label>

                  <div className="rule-actions">
                    <button
                      className="rule-action-btn"
                      title="Test this rule"
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
                      <FaFlask />
                    </button>
                    <button className="rule-action-btn" title="Edit rule" onClick={() => handleOpenEdit(rule)}>
                      <FaPencilAlt />
                    </button>
                    <button
                      className="rule-action-btn delete"
                      title="Delete rule"
                      onClick={() => handleDeleteRule(rule._id)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingRule ? 'Edit Rule' : 'Create Categorization Rule'}</h2>
              <button
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
                onClick={() => setIsModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveRule}>
              <div className="modal-body">
                <div className="form-row">
                  <label>Rule Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amazon to Shopping"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <label>Target Field</label>
                  <select
                    value={formData.field}
                    onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                  >
                    <option value="description">Description</option>
                    <option value="merchant">Merchant</option>
                    <option value="paymentMethod">Payment Method</option>
                  </select>
                </div>

                <div className="form-row">
                  <label>Operator</label>
                  <select
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
                  <label>Match Value</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. amazon or uber"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <label>Assign Category</label>
                  <select
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
                  <label>Priority (Higher priority rules evaluate first)</label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingRule ? 'Update Rule' : 'Create Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Test Rule Simulator Modal */}
      {isTestModalOpen && (
        <div className="modal-overlay" onClick={() => setIsTestModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Rule Test Simulator</h2>
              <button
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
                onClick={() => setIsTestModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <label>Operator</label>
                <select
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
                <label>Value Pattern</label>
                <input
                  type="text"
                  placeholder="e.g. amazon"
                  value={testTargetRule.value}
                  onChange={(e) => setTestTargetRule({ ...testTargetRule, value: e.target.value })}
                />
              </div>

              <div className="form-row">
                <label>Assigned Category</label>
                <select
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
                <label>Sample Text to Test</label>
                <input
                  type="text"
                  placeholder="e.g. Amazon Prime Video #4491"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="btn-primary"
                style={{ marginTop: '0.5rem' }}
                onClick={handleRunTest}
              >
                Run Match Simulation
              </button>

              {testResult && (
                <div className={`test-result-box ${testResult.matched ? 'match' : 'no-match'}`}>
                  {testResult.matched ? (
                    <>
                      <FaCheckCircle style={{ fontSize: '1.25rem', color: '#10b981' }} />
                      <div>
                        <strong>Match Found!</strong>
                        <div>Auto-assigned Category: <strong>{testResult.category}</strong></div>
                      </div>
                    </>
                  ) : (
                    <>
                      <FaTimesCircle style={{ fontSize: '1.25rem', color: '#ef4444' }} />
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
              <button type="button" className="btn-secondary" onClick={() => setIsTestModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RulesPage;
