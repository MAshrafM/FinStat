// frontend/src/components/ui/Badge.js
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Badge primitive wrapping .fs-badge (§8.4).
 * Neutral chip + three semantic tones; strictly requires a label; no tinted fills.
 *
 * Precedence rules:
 * - Both `label` and `children`: `label` becomes `aria-label`; `children` renders visibly.
 * - Only `label`: renders `label` as visible text content.
 * - Only `children`: renders `children` visibly.
 * - Neither: development warning, renders null.
 *
 * @param {Object} props
 * @param {'neutral' | 'positive' | 'negative' | 'warning'} [props.tone='neutral']
 * @param {string} [props.label]
 * @param {React.ReactNode} [props.children]
 * @param {string} [props.className]
 */
const Badge = ({
  tone = 'neutral',
  label,
  children,
  className = '',
  ...rest
}) => {
  const hasLabel = Boolean(label && label.trim && label.trim().length > 0);
  const hasChildren = Boolean(children);

  if (!hasLabel && !hasChildren) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Badge] A badge requires a label or children.');
    }
    return null;
  }

  const toneClass = tone !== 'neutral' ? `fs-badge--${tone}` : '';
  const classes = ['fs-badge', toneClass, className].filter(Boolean).join(' ');

  // Both provided: label is aria-label, children is visual content
  if (hasLabel && hasChildren) {
    return (
      <span className={classes} aria-label={label} {...rest}>
        {children}
      </span>
    );
  }

  // Only label provided: label renders visibly
  if (hasLabel && !hasChildren) {
    return (
      <span className={classes} {...rest}>
        {label}
      </span>
    );
  }

  // Only children provided: children renders visibly
  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  );
};

Badge.propTypes = {
  tone: PropTypes.oneOf(['neutral', 'positive', 'negative', 'warning']),
  label: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string,
};

export default Badge;
