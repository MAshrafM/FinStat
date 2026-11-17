// frontend/src/components/ui/Button.js
import React from 'react';
import PropTypes from 'prop-types';
import Loading from './Loading';

/**
 * Button primitive wrapping .fs-btn and semantic variants (§8.4).
 *
 * @param {Object} props
 * @param {React.ElementType} [props.as='button']
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
  as: Component = 'button',
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  disabled = false,
  type = Component === 'button' ? 'button' : undefined,
  icon,
  iconRight,
  className = '',
  children,
  'aria-disabled': ariaDisabled,
  ...rest
}) => {
  const variantClass = `fs-btn-${variant}`;
  const sizeClass = size === 'sm' ? 'fs-btn-sm' : '';
  const classes = ['fs-btn', variantClass, sizeClass, className].filter(Boolean).join(' ');

  const isDisabled = Boolean(disabled || isLoading || ariaDisabled === 'true' || ariaDisabled === true);

  return (
    <Component
      type={type}
      className={classes}
      disabled={Component === 'button' ? isDisabled : undefined}
      aria-busy={isLoading ? 'true' : undefined}
      aria-disabled={isDisabled ? 'true' : undefined}
      {...rest}
    >
      {isLoading ? (
        <Loading variant="inline" />
      ) : (
        icon && <span className="fs-btn-icon-left" aria-hidden="true">{icon}</span>
      )}
      {children}
      {!isLoading && iconRight && (
        <span className="fs-btn-icon-right" aria-hidden="true">{iconRight}</span>
      )}
    </Component>
  );
};

Button.propTypes = {
  as: PropTypes.elementType,
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
