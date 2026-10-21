// frontend/src/components/common/ProtectedAction.js
import React from 'react';
import { useCanModify } from '../../context/AuthContext';
import './ProtectedAction.css';

/**
 * Reusable wrapper that protects action triggers (buttons, links, form inputs) from viewer mutation.
 *
 * Behavior:
 * - If user canModify: Renders children unmodified.
 * - If user is viewer:
 *   - If hide is true: Renders fallback (or null).
 *   - If hide is false (default): Clones child with disabled attributes, prevents click/keyboard
 *     events, and wraps in an accessible tooltip container with title="View-only access".
 */
export const ProtectedAction = ({
  children,
  tooltip = 'View-only access',
  hide = false,
  className = '',
  fallback = null,
}) => {
  const { canModify } = useCanModify();

  if (canModify) {
    return children;
  }

  if (hide) {
    return fallback;
  }

  const preventAction = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  if (React.isValidElement(children)) {
    const isNativeButton = children.type === 'button' || children.props?.type === 'submit';

    const cloned = React.cloneElement(children, {
      disabled: isNativeButton ? true : undefined,
      'aria-disabled': 'true',
      tabIndex: -1,
      onClick: preventAction,
      onKeyDown: handleKeyDown,
      className: `${children.props.className || ''} protected-disabled`.trim(),
    });

    return (
      <span
        className={`protected-action-wrapper ${className}`.trim()}
        title={tooltip}
        role="presentation"
        onClick={preventAction}
      >
        {cloned}
      </span>
    );
  }

  return (
    <span
      className={`protected-action-wrapper ${className}`.trim()}
      title={tooltip}
      role="presentation"
      onClick={preventAction}
    >
      {children}
    </span>
  );
};

export default ProtectedAction;
