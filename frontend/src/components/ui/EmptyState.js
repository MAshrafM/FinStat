// frontend/src/components/ui/EmptyState.js
import React from 'react';
import PropTypes from 'prop-types';

/**
 * EmptyState primitive (§8.4).
 * Icon + one line title + optional description + optional action.
 *
 * @param {Object} props
 * @param {React.ReactNode} [props.icon]
 * @param {React.ReactNode} props.title - Required primary message
 * @param {React.ReactNode} [props.description]
 * @param {React.ReactNode} [props.action] - Optional CTA button or element
 * @param {string} [props.className]
 */
const EmptyState = ({
  icon,
  title,
  description,
  action,
  className = '',
  ...rest
}) => {
  const classes = ['fs-empty', className].filter(Boolean).join(' ');

  return (
    <div className={classes} role="status" {...rest}>
      {icon && <div className="fs-empty-icon" aria-hidden="true">{icon}</div>}
      <h3 className="fs-empty-title">{title}</h3>
      {description && <p className="fs-empty-desc">{description}</p>}
      {action && <div className="fs-empty-action">{action}</div>}
    </div>
  );
};

EmptyState.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.node.isRequired,
  description: PropTypes.node,
  action: PropTypes.node,
  className: PropTypes.string,
};

export default EmptyState;
