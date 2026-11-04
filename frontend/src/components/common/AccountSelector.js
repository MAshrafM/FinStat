// frontend/src/components/common/AccountSelector.js
import React from 'react';
import PropTypes from 'prop-types';

const SOURCE_OPTIONS = [
  { value: 'Bank', label: 'Bank Account' },
  { value: 'Cash', label: 'Cash Ledger' },
];

const DESTINATION_OPTIONS = [
  { value: 'Bank', label: 'Bank Account' },
  { value: 'Cash', label: 'Cash Ledger' },
  { value: 'Prepaid', label: 'Prepaid Card' },
];

/**
 * Reusable Account Selector dropdown for asset bridge transactions.
 * Enforces architectural asymmetry:
 * - 'source' direction (outflows / asset purchases) allows only Bank and Cash.
 * - 'destination' direction (inflows / liquidations / coupons) allows Bank, Cash, and Prepaid.
 */
const AccountSelector = ({
  value = 'Bank',
  onChange,
  direction = 'source',
  label,
  disabled = false,
  name,
  className = 'form-group',
  selectClassName = '',
  id,
  required = false,
}) => {
  const isSource = direction === 'source';
  const defaultLabel = isSource ? 'Paid From (Source Account)' : 'Deposit To (Destination Account)';
  const displayLabel = label !== undefined ? label : defaultLabel;
  const fieldName = name || (isSource ? 'sourceAccount' : 'destinationAccount');
  const selectId = id || `account-selector-${fieldName}`;
  const options = isSource ? SOURCE_OPTIONS : DESTINATION_OPTIONS;

  return (
    <div className={className}>
      {displayLabel && <label htmlFor={selectId}>{displayLabel}</label>}
      <select
        id={selectId}
        name={fieldName}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={selectClassName}
        required={required}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

AccountSelector.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  direction: PropTypes.oneOf(['source', 'destination']),
  label: PropTypes.string,
  disabled: PropTypes.bool,
  name: PropTypes.string,
  className: PropTypes.string,
  selectClassName: PropTypes.string,
  id: PropTypes.string,
  required: PropTypes.bool,
};

export default AccountSelector;
