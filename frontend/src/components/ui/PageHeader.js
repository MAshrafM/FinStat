// frontend/src/components/ui/PageHeader.js
import React from 'react';
import PropTypes from 'prop-types';

/**
 * PageHeader primitive (§8.4).
 * Title/subtitle/actions anatomy; eyebrow optional and off by default.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.title - Required page title
 * @param {React.ReactNode} [props.subtitle] - Optional subtitle
 * @param {React.ReactNode} [props.eyebrow] - Optional eyebrow (off by default)
 * @param {React.ReactNode} [props.actions] - Optional action controls slot
 * @param {string} [props.className]
 */
const PageHeader = ({
  title,
  subtitle,
  eyebrow,
  actions,
  className = '',
  ...rest
}) => {
  const classes = ['fs-page-head', className].filter(Boolean).join(' ');

  return (
    <header className={classes} {...rest}>
      <div className="fs-page-head-content">
        {eyebrow && <div className="fs-eyebrow">{eyebrow}</div>}
        <h1 className="fs-page-title">{title}</h1>
        {subtitle && <p className="fs-page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="fs-page-actions">{actions}</div>}
    </header>
  );
};

PageHeader.propTypes = {
  title: PropTypes.node.isRequired,
  subtitle: PropTypes.node,
  eyebrow: PropTypes.node,
  actions: PropTypes.node,
  className: PropTypes.string,
};

export default PageHeader;
