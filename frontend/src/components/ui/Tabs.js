// frontend/src/components/ui/Tabs.js
import React, { useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Tabs primitive (§8.4).
 * Accessible tablist supporting keyboard navigation and ARIA APG tab pattern.
 *
 * @param {Object} props
 * @param {Array<{ id: string, label: string, icon?: React.ReactNode, disabled?: boolean, badge?: React.ReactNode }>} props.tabs
 * @param {string} props.activeTab - Currently active tab id
 * @param {function(string): void} props.onChange - Selection handler
 * @param {string} props.ariaLabel - Accessible name for role="tablist"
 * @param {'horizontal' | 'vertical'} [props.orientation='horizontal']
 * @param {string} [props.className]
 */
const Tabs = ({
  tabs = [],
  activeTab,
  onChange,
  ariaLabel,
  orientation = 'horizontal',
  className = '',
  ...rest
}) => {
  const tabRefs = useRef([]);

  const enabledTabs = tabs.filter(t => !t.disabled);

  const focusTabByIndex = (index) => {
    if (tabRefs.current[index]) {
      tabRefs.current[index].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    const isHorizontal = orientation === 'horizontal';
    let targetIndex = -1;

    if (isHorizontal) {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        targetIndex = (index + 1) % tabs.length;
        while (tabs[targetIndex]?.disabled && targetIndex !== index) {
          targetIndex = (targetIndex + 1) % tabs.length;
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        targetIndex = (index - 1 + tabs.length) % tabs.length;
        while (tabs[targetIndex]?.disabled && targetIndex !== index) {
          targetIndex = (targetIndex - 1 + tabs.length) % tabs.length;
        }
      }
      // ArrowDown / ArrowUp are inert in horizontal mode
    } else {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        targetIndex = (index + 1) % tabs.length;
        while (tabs[targetIndex]?.disabled && targetIndex !== index) {
          targetIndex = (targetIndex + 1) % tabs.length;
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        targetIndex = (index - 1 + tabs.length) % tabs.length;
        while (tabs[targetIndex]?.disabled && targetIndex !== index) {
          targetIndex = (targetIndex - 1 + tabs.length) % tabs.length;
        }
      }
      // ArrowRight / ArrowLeft are inert in vertical mode
    }

    if (e.key === 'Home') {
      e.preventDefault();
      targetIndex = tabs.findIndex(t => !t.disabled);
    } else if (e.key === 'End') {
      e.preventDefault();
      for (let i = tabs.length - 1; i >= 0; i--) {
        if (!tabs[i].disabled) {
          targetIndex = i;
          break;
        }
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const currentTab = tabs[index];
      if (currentTab && !currentTab.disabled && onChange) {
        onChange(currentTab.id);
      }
      return;
    }

    if (targetIndex >= 0 && targetIndex < tabs.length && !tabs[targetIndex].disabled) {
      focusTabByIndex(targetIndex);
    }
  };

  const classes = ['fs-tabs', className].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      role="tablist"
      aria-label={ariaLabel}
      aria-orientation={orientation}
      {...rest}
    >
      {tabs.map((tab, idx) => {
        const isActive = tab.id === activeTab;
        const tabClasses = [
          'fs-tab',
          isActive ? 'fs-tab--active' : '',
        ].filter(Boolean).join(' ');

        return (
          <button
            key={tab.id}
            ref={(el) => (tabRefs.current[idx] = el)}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-controls={tab.panelId || undefined}
            aria-selected={isActive}
            aria-disabled={tab.disabled ? 'true' : undefined}
            tabIndex={isActive ? 0 : -1}
            disabled={tab.disabled}
            className={tabClasses}
            onClick={() => {
              if (!tab.disabled && onChange) {
                onChange(tab.id);
              }
            }}
            onKeyDown={(e) => handleKeyDown(e, idx)}
          >
            {tab.icon && <span className="fs-tab-icon" aria-hidden="true">{tab.icon}</span>}
            <span className="fs-tab-label">{tab.label}</span>
            {tab.badge && <span className="fs-tab-badge">{tab.badge}</span>}
          </button>
        );
      })}
    </div>
  );
};

Tabs.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.node,
      disabled: PropTypes.bool,
      badge: PropTypes.node,
    })
  ).isRequired,
  activeTab: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  ariaLabel: PropTypes.string.isRequired,
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  className: PropTypes.string,
};

export default Tabs;
