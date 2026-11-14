// frontend/src/components/ui/Delta.js
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Delta primitive wrapping .fs-delta (§8.4, §4.3 rule 6).
 * Required component for amount deltas.
 *
 * Uses Option B accessible announcement (visible content announces naturally
 * without duplicating aria-label, avoiding screen reader double-announcements).
 *
 * @param {Object} props
 * @param {number | string} props.value
 * @param {'neutral' | 'positive' | 'negative' | 'warning'} [props.tone='neutral']
 * @param {'auto' | 'none' | 'positive' | 'negative'} [props.sign='auto']
 * @param {string} props.label - Required descriptive label (e.g. "vs previous period")
 * @param {string} [props.className]
 */
const Delta = ({
  value,
  tone = 'neutral',
  sign = 'auto',
  label,
  className = '',
  ...rest
}) => {
  if (!label && process.env.NODE_ENV !== 'production') {
    console.warn('[Delta] A descriptive label is required for accessibility.');
  }

  // Resolve sign symbol
  let signChar = '';
  if (sign === 'positive') {
    signChar = '+';
  } else if (sign === 'negative') {
    signChar = '\u2212'; // Unicode minus
  } else if (sign === 'auto') {
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (!Number.isNaN(num)) {
      if (num > 0) {
        signChar = '+';
      } else if (num < 0) {
        signChar = '\u2212';
      }
    }
  }

  // If value is a negative number and signChar is minus, display absolute value to avoid "--123"
  let displayValue = value;
  if (typeof value === 'number' && value < 0 && signChar === '\u2212') {
    displayValue = Math.abs(value);
  } else if (typeof value === 'string' && value.startsWith('-') && signChar === '\u2212') {
    displayValue = value.slice(1);
  }

  const toneClass = `fs-delta--${tone}`;
  const classes = ['fs-delta', toneClass, className].filter(Boolean).join(' ');

  return (
    <span className={classes} {...rest}>
      <span className="fs-delta-value">
        {signChar}
        {displayValue}
      </span>
      {label && <span className="fs-delta-label">{label}</span>}
    </span>
  );
};

Delta.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  tone: PropTypes.oneOf(['neutral', 'positive', 'negative', 'warning']),
  sign: PropTypes.oneOf(['auto', 'none', 'positive', 'negative']),
  label: PropTypes.string.isRequired,
  className: PropTypes.string,
};

export default Delta;
