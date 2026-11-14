// frontend/src/components/ui/Button.js
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Button primitive wrapping .fs-btn and semantic variants (§8.4).
 *
 * @param {Object} props
 * @param {'primary' | 'secondary' | 'ghost' | 'danger'} [props.variant='secondary']
 * @param {'sm' | 'md'} [props.size='md']
 * @param {boolean} [props.isLoading=false]
 * @param {boolean} [props.disabled=false]
 * @param {'button' | 'submit' | 'reset'} [props.type='button']
 * @param {React.ReactNode} [props.icon]
 * @param {React.ReactNode} [props.iconRight]
 * @param {string} [props.className]
 * @param {React.ReactNode} [props.children]
 */
const Button = ({
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  disabled = false,
  type = 'button',
  icon,
  iconRight,
  className = '',
  children,
  ...rest
}) => {
  const variantClass = `fs-btn-${variant}`;
  const sizeClass = size === 'sm' ? 'fs-btn-sm' : '';
  const classes = ['fs-btn', variantClass, sizeClass, className].filter(Boolean).join(' ');

  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      className={classes}
      disabled={isDisabled}
      aria-busy={isLoading ? 'true' : undefined}
      aria-disabled={isDisabled ? 'true' : undefined}
      {...rest}
    >
      {isLoading ? (
        <span className="loading-spinner" aria-hidden="true" />
      ) : (
        icon && <span className="fs-btn-icon-left" aria-hidden="true">{icon}</span>
      )}
      {children}
      {!isLoading && iconRight && (
        <span className="fs-btn-icon-right" aria-hidden="true">{iconRight}</span>
      )}
    </button>
  );
};

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'ghost', 'danger']),
  size: PropTypes.oneOf(['sm', 'md']),
  isLoading: PropTypes.bool,
  disabled: PropTypes.bool,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  icon: PropTypes.node,
  iconRight: PropTypes.node,
  className: PropTypes.string,
  children: PropTypes.node,
};

export default Button;
