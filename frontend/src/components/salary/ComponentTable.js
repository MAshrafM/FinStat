// frontend/src/components/salary/ComponentTable.js
import React from 'react';
import { Plus, Trash2, Shield, Receipt } from 'lucide-react';
import './ComponentTable.css';

const CATEGORIES = [
  { value: 'basic', label: 'Basic Salary', color: '#6366f1' },
  { value: 'allowance', label: 'Allowance', color: '#10b981' },
  { value: 'bonus', label: 'Bonus / Incentive', color: '#f59e0b' },
  { value: 'deduction', label: 'Deduction', color: '#ef4444' },
  { value: 'other', label: 'Other', color: '#8b5cf6' },
];

const ComponentTable = ({
  components = [],
  onChange,
  readOnly = false,
}) => {
  const handleAddComponent = () => {
    if (readOnly) return;
    const newComponent = {
      name: '',
      category: 'allowance',
      type: 'fixed',
      value: 0,
      calculationBasis: 'basic',
      isTaxable: true,
      isInsurable: true,
      isActive: true,
    };
    onChange([...components, newComponent]);
  };

  const handleRemoveComponent = (index) => {
    if (readOnly) return;
    const updated = components.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleFieldChange = (index, field, val) => {
    if (readOnly) return;
    const updated = components.map((comp, i) => {
      if (i !== index) return comp;
      const updatedComp = { ...comp, [field]: val };
      // If changed to percentage, default calculationBasis to 'basic' if not set
      if (field === 'type' && val === 'percentage' && !updatedComp.calculationBasis) {
        updatedComp.calculationBasis = 'basic';
      }
      return updatedComp;
    });
    onChange(updated);
  };

  return (
    <div className="component-table-wrapper">
      <div className="component-table-header-bar">
        <div className="component-table-title-area">
          <h4 className="component-table-heading">Salary & Pay Components</h4>
          <span className="component-count-badge">{components.length} component{components.length !== 1 ? 's' : ''}</span>
        </div>
        {!readOnly && (
          <button
            type="button"
            className="add-component-btn"
            onClick={handleAddComponent}
          >
            <Plus size={16} />
            <span>Add Component</span>
          </button>
        )}
      </div>

      {components.length === 0 ? (
        <div className="component-empty-state">
          <p>No components defined yet.</p>
          {!readOnly && (
            <button
              type="button"
              className="add-first-component-btn"
              onClick={handleAddComponent}
            >
              <Plus size={16} /> Add First Component
            </button>
          )}
        </div>
      ) : (
        <div className="table-responsive-container">
          <table className="custom-component-table">
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Component Name</th>
                <th style={{ width: '18%' }}>Category</th>
                <th style={{ width: '14%' }}>Type</th>
                <th style={{ width: '16%' }}>Basis / Value</th>
                <th style={{ width: '10%' }} title="Subject to income tax">
                  <span className="th-icon-label"><Receipt size={14} /> Taxable</span>
                </th>
                <th style={{ width: '10%' }} title="Subject to social insurance">
                  <span className="th-icon-label"><Shield size={14} /> Insurable</span>
                </th>
                {!readOnly && <th style={{ width: '10%' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {components.map((comp, idx) => {
                const currentCategory = CATEGORIES.find(c => c.value === comp.category) || CATEGORIES[0];
                return (
                  <tr key={idx} className={comp.category === 'deduction' ? 'row-deduction' : ''}>
                    <td>
                      {readOnly ? (
                        <span className="component-name-readonly">{comp.name || 'Unnamed Component'}</span>
                      ) : (
                        <input
                          type="text"
                          className="component-input"
                          placeholder="e.g. Basic Salary, Transport"
                          value={comp.name || ''}
                          onChange={(e) => handleFieldChange(idx, 'name', e.target.value)}
                          required
                        />
                      )}
                    </td>
                    <td>
                      {readOnly ? (
                        <span
                          className="category-badge-pill"
                          style={{
                            backgroundColor: `${currentCategory.color}20`,
                            color: currentCategory.color,
                            borderColor: `${currentCategory.color}40`,
                          }}
                        >
                          {currentCategory.label}
                        </span>
                      ) : (
                        <select
                          className="component-select"
                          value={comp.category || 'allowance'}
                          onChange={(e) => handleFieldChange(idx, 'category', e.target.value)}
                        >
                          {CATEGORIES.map(cat => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td>
                      {readOnly ? (
                        <span className="type-badge-pill">
                          {comp.type === 'percentage' ? '% Percentage' : 'Fixed EGP'}
                        </span>
                      ) : (
                        <select
                          className="component-select"
                          value={comp.type || 'fixed'}
                          onChange={(e) => handleFieldChange(idx, 'type', e.target.value)}
                        >
                          <option value="fixed">Fixed (EGP)</option>
                          <option value="percentage">% Percentage</option>
                        </select>
                      )}
                    </td>
                    <td>
                      <div className="basis-value-cell">
                        {comp.type === 'percentage' && (
                          readOnly ? (
                            <span className="basis-tag">of {comp.calculationBasis || 'gross'}</span>
                          ) : (
                            <select
                              className="component-basis-select"
                              value={comp.calculationBasis || 'basic'}
                              onChange={(e) => handleFieldChange(idx, 'calculationBasis', e.target.value)}
                              title="Calculation Basis"
                            >
                              <option value="basic">of Basic</option>
                              <option value="gross">of Gross</option>
                            </select>
                          )
                        )}
                        {readOnly ? (
                          <span className="value-readonly font-semibold">
                            {comp.type === 'percentage' ? `${comp.value}%` : `${Number(comp.value || 0).toLocaleString()} EGP`}
                          </span>
                        ) : (
                          <div className="number-input-wrapper">
                            <input
                              type="number"
                              step="any"
                              className="component-input number-input"
                              placeholder="0"
                              value={comp.value !== undefined ? comp.value : 0}
                              onChange={(e) => handleFieldChange(idx, 'value', parseFloat(e.target.value) || 0)}
                            />
                            <span className="unit-suffix">{comp.type === 'percentage' ? '%' : 'EGP'}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="text-center">
                      <label className="checkbox-toggle-container">
                        <input
                          type="checkbox"
                          checked={comp.isTaxable !== false}
                          disabled={readOnly}
                          onChange={(e) => handleFieldChange(idx, 'isTaxable', e.target.checked)}
                        />
                        <span className="checkmark"></span>
                      </label>
                    </td>
                    <td className="text-center">
                      <label className="checkbox-toggle-container">
                        <input
                          type="checkbox"
                          checked={comp.isInsurable !== false}
                          disabled={readOnly}
                          onChange={(e) => handleFieldChange(idx, 'isInsurable', e.target.checked)}
                        />
                        <span className="checkmark"></span>
                      </label>
                    </td>
                    {!readOnly && (
                      <td className="text-center">
                        <button
                          type="button"
                          className="remove-row-btn"
                          title="Remove Component"
                          onClick={() => handleRemoveComponent(idx)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ComponentTable;
