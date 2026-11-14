// frontend/src/components/ui/Card.js
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Card primitive wrapping .fs-card with opaque surface and 1px border (§8.4).
 *
 * @param {Object} props
 * @param {'default' | 'raised'} [props.variant='default']
 * @param {React.ReactNode} [props.header]
 * @param {React.ReactNode} [props.footer]
 * @param {string} [props.className]
 * @param {React.ReactNode} [props.children]
 */
const Card = ({
  variant = 'default',
  header,
  footer,
  className = '',
  children,
  ...rest
}) => {
  const variantClass = variant === 'raised' ? 'fs-card--raised' : '';
  const classes = ['fs-card', variantClass, className].filter(Boolean).join(' ');

  return (
    <div className={classes} {...rest}>
      {header && <div className="fs-card-header">{header}</div>}
      <div className="fs-card-body">{children}</div>
      {footer && <div className="fs-card-footer">{footer}</div>}
    </div>
  );
};

Card.propTypes = {
  variant: PropTypes.oneOf(['default', 'raised']),
  header: PropTypes.node,
  footer: PropTypes.node,
  className: PropTypes.string,
  children: PropTypes.node,
};

export default Card;
