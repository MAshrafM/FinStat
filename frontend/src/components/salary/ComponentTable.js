// frontend/src/components/salary/ComponentTable.js
import React from 'react';
import { Plus, Trash2, Shield, Receipt } from 'lucide-react';
import Badge from '../ui/Badge';
import './ComponentTable.css';

const CATEGORIES = [
  { value: 'basic', label: 'Basic Salary' },
  { value: 'allowance', label: 'Allowance' },
  { value: 'bonus', label: 'Bonus / Incentive' },
  { value: 'deduction', label: 'Deduction' },
  { value: 'other', label: 'Other' },
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
                <th className="col-component-name">Component Name</th>
                <th className="col-category">Category</th>
                <th className="col-type">Type</th>
                <th className="col-basis">Basis / Value</th>
                <th className="col-status" title="Active status in profile">Active</th>
                <th className="col-taxable" title="Subject to income tax">
                  <span className="th-icon-label"><Receipt size={14} /> Taxable</span>
                </th>
                <th className="col-insurable" title="Subject to social insurance">
                  <span className="th-icon-label"><Shield size={14} /> Insurable</span>
                </th>
                {!readOnly && <th className="col-actions">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {components.map((comp, idx) => {
                const currentCategory = CATEGORIES.find(c => c.value === comp.category) || CATEGORIES[0];
                const isInactive = comp.isActive === false;
                return (
                  <tr
                    key={idx}
                    className={[
                      comp.category === 'deduction' ? 'row-deduction' : '',
                      isInactive ? 'row-inactive' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    <td data-label="Component Name">
                      {readOnly ? (
                        <div className="component-name-cell">
                          <span className="component-name-readonly">{comp.name || 'Unnamed Component'}</span>
                          {isInactive && (
                            <Badge tone="neutral" label="Inactive" className="badge-inactive">
                              Inactive
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <div className="component-name-cell">
                          <input
                            type="text"
                            className="component-input"
                            placeholder="e.g. Basic Salary, Transport"
                            value={comp.name || ''}
                            onChange={(e) => handleFieldChange(idx, 'name', e.target.value)}
                            required
                            aria-label={`Component name for row ${idx + 1}`}
                          />
                          {isInactive && (
                            <Badge tone="neutral" label="Inactive" className="badge-inactive">
                              Inactive
                            </Badge>
                          )}
                        </div>
                      )}
                    </td>
                    <td data-label="Category">
                      {readOnly ? (
                        <Badge tone="neutral" label={currentCategory.label} className="category-badge-pill">
                          {currentCategory.label}
                        </Badge>
                      ) : (
                        <select
                          className="component-select"
                          value={comp.category || 'allowance'}
                          onChange={(e) => handleFieldChange(idx, 'category', e.target.value)}
                          aria-label={`Category for ${comp.name || 'component'}`}
                        >
                          {CATEGORIES.map(cat => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td data-label="Type">
                      {readOnly ? (
                        <span className="type-badge-pill">
                          {comp.type === 'percentage' ? '% Percentage' : 'Fixed EGP'}
                        </span>
                      ) : (
                        <select
                          className="component-select"
                          value={comp.type || 'fixed'}
                          onChange={(e) => handleFieldChange(idx, 'type', e.target.value)}
                          aria-label={`Type for ${comp.name || 'component'}`}
                        >
                          <option value="fixed">Fixed (EGP)</option>
                          <option value="percentage">% Percentage</option>
                        </select>
                      )}
                    </td>
                    <td data-label="Basis / Value">
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
                              aria-label={`Calculation basis for ${comp.name || 'component'}`}
                            >
                              <option value="basic">of Basic</option>
                              <option value="gross">of Gross</option>
                            </select>
                          )
                        )}
                        {readOnly ? (
                          <span className="value-readonly fs-num font-semibold">
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
                              aria-label={`Value for ${comp.name || 'component'}`}
                            />
                            <span className="unit-suffix">{comp.type === 'percentage' ? '%' : 'EGP'}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td data-label="Active" className="text-center">
                      <label
                        className="checkbox-toggle-container"
                        title={comp.category === 'basic' ? 'Basic salary cannot be disabled' : (comp.isActive !== false ? 'Active' : 'Inactive')}
                      >
                        <input
                          type="checkbox"
                          checked={comp.isActive !== false}
                          disabled={readOnly || comp.category === 'basic'}
                          onChange={(e) => handleFieldChange(idx, 'isActive', e.target.checked)}
                          aria-label={`Toggle active for ${comp.name || 'component'}`}
                        />
                        <span className="checkmark"></span>
                      </label>
                    </td>
                    <td data-label="Taxable" className="text-center">
                      <label className="checkbox-toggle-container" title="Taxable">
                        <input
                          type="checkbox"
                          checked={comp.isTaxable !== false}
                          disabled={readOnly}
                          onChange={(e) => handleFieldChange(idx, 'isTaxable', e.target.checked)}
                          aria-label={`Toggle taxable for ${comp.name || 'component'}`}
                        />
                        <span className="checkmark"></span>
                      </label>
                    </td>
                    <td data-label="Insurable" className="text-center">
                      <label className="checkbox-toggle-container" title="Insurable">
                        <input
                          type="checkbox"
                          checked={comp.isInsurable !== false}
                          disabled={readOnly}
                          onChange={(e) => handleFieldChange(idx, 'isInsurable', e.target.checked)}
                          aria-label={`Toggle insurable for ${comp.name || 'component'}`}
                        />
                        <span className="checkmark"></span>
                      </label>
                    </td>
                    {!readOnly && (
                      <td data-label="Actions" className="text-center">
                        <button
                          type="button"
                          className="remove-component-btn remove-row-btn"
                          title="Remove Component"
                          aria-label={`Remove component ${comp.name || idx + 1}`}
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
