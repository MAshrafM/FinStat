import React from 'react';

const VALID_VARIANTS = ['route', 'card', 'table', 'form-field', 'inline'];

/**
 * Loading primitive (§8.4 Primitive #8).
 * Universal loading indicator for FinStat (D23).
 *
 * Variants:
 * - 'route': Centered spinner with text for route-level Suspense fallbacks.
 * - 'card': Skeleton block representing a card/widget loading.
 * - 'table': Skeleton rows representing tabular data loading.
 * - 'form-field': Skeleton input representing form field loading.
 * - 'inline': Compact inline spinner for buttons or inline status elements.
 *
 * @param {Object} props
 * @param {'route' | 'card' | 'table' | 'form-field' | 'inline'} [props.variant='route']
 * @param {string} [props.text] - Accessible loading message (e.g. "Loading...")
 * @param {number} [props.rows=3] - Number of skeleton rows when variant='table'
 * @param {string} [props.className]
 * @param {string} [props.ariaLabel]
 */
const Loading = ({
  variant = 'route',
  text,
  rows = 3,
  className = '',
  ariaLabel,
  ...rest
}) => {
  const safeVariant = VALID_VARIANTS.includes(variant) ? variant : 'route';
  const accessibleName = ariaLabel || text || 'Loading...';

  if (safeVariant === 'inline') {
    return (
      <span
        className={['fs-loading', 'fs-loading--inline', className].filter(Boolean).join(' ')}
        role="status"
        {...rest}
      >
        <span className="fs-loading-spinner fs-loading-spinner--sm" aria-hidden="true" />
        {text ? (
          <span className="fs-loading-text">{text}</span>
        ) : (
          <span className="fs-visually-hidden">{accessibleName}</span>
        )}
      </span>
    );
  }

  if (safeVariant === 'table') {
    const rowCount = Math.max(1, Math.min(rows, 20));
    return (
      <div
        className={['fs-loading', 'fs-loading--table', className].filter(Boolean).join(' ')}
        role="status"
        aria-label={accessibleName}
        {...rest}
      >
        {text && <p className="fs-loading-text">{text}</p>}
        <div className="fs-skeleton-rows" aria-hidden="true">
          {Array.from({ length: rowCount }).map((_, i) => (
            <div key={i} className="fs-skeleton fs-skeleton--row" />
          ))}
        </div>
      </div>
    );
  }

  if (safeVariant === 'card') {
    return (
      <div
        className={['fs-loading', 'fs-loading--card', className].filter(Boolean).join(' ')}
        role="status"
        aria-label={accessibleName}
        {...rest}
      >
        {text && <p className="fs-loading-text">{text}</p>}
        <div className="fs-skeleton fs-skeleton--card" aria-hidden="true" />
      </div>
    );
  }

  if (safeVariant === 'form-field') {
    return (
      <div
        className={['fs-loading', 'fs-loading--form-field', className].filter(Boolean).join(' ')}
        role="status"
        aria-label={accessibleName}
        {...rest}
      >
        {text && <p className="fs-loading-text">{text}</p>}
        <div className="fs-skeleton fs-skeleton--form-field" aria-hidden="true" />
      </div>
    );
  }

  // Default: safeVariant === 'route'
  return (
    <div
      className={['fs-loading', 'fs-loading--route', className].filter(Boolean).join(' ')}
      role="status"
      {...rest}
    >
      <div className="fs-loading-spinner" aria-hidden="true" />
      <p className="fs-loading-text">{text || 'Loading...'}</p>
    </div>
  );
};

export default Loading;
