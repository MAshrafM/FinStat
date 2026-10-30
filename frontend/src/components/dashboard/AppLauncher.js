// frontend/src/components/dashboard/AppLauncher.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaTimes, FaPlus, FaCompass, FaArrowRight, FaLock } from 'react-icons/fa';
import { useCanModify } from '../../context/AuthContext';
import { CREATE_ACTION_GROUPS, EXPLORE_ACTION_GROUPS } from '../../config/dashboardActions';
import './AppLauncher.css';

const AppLauncher = ({ open, initialTab = 'create', onClose }) => {
  const { canModify } = useCanModify();
  const [tab, setTab] = useState(initialTab);
  const [query, setQuery] = useState('');
  const searchRef = useRef(null);

  const effectiveTab = !canModify && tab === 'create' ? 'explore' : tab;

  // Reset the launcher each time it opens and focus the search field.
  useEffect(() => {
    if (!open) return;
    setTab(initialTab);
    setQuery('');
    const focusTimer = setTimeout(() => searchRef.current?.focus(), 60);
    return () => clearTimeout(focusTimer);
  }, [open, initialTab]);

  // Escape to close + prevent the page behind the dialog from scrolling.
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  const filteredGroups = useMemo(() => {
    const source = effectiveTab === 'create' ? CREATE_ACTION_GROUPS : EXPLORE_ACTION_GROUPS;
    const needle = query.trim().toLowerCase();

    if (!needle) return source;

    return source
      .map((group) => ({
        ...group,
        actions: group.actions.filter((action) =>
          `${action.label} ${action.description} ${action.key}`.toLowerCase().includes(needle)
        ),
      }))
      .filter((group) => group.actions.length > 0);
  }, [effectiveTab, query]);

  const resultCount = filteredGroups.reduce((total, group) => total + group.actions.length, 0);

  if (!open) return null;

  return (
    <div className="launcher-backdrop" onMouseDown={onClose} role="presentation">
      <div
        className="launcher-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="launcher-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="launcher-header">
          <div className="launcher-heading">
            <span className="launcher-mark">
              <FaPlus aria-hidden="true" />
            </span>
            <div>
              <h2 id="launcher-title">Launchpad</h2>
              <p>Add a record or jump straight into a summary.</p>
            </div>
          </div>
          <button type="button" className="launcher-close" onClick={onClose} aria-label="Close launcher">
            <FaTimes aria-hidden="true" />
          </button>
        </div>

        <div className="launcher-tabs" role="tablist" aria-label="Launcher modes">
          {canModify && (
            <button
              type="button"
              role="tab"
              aria-selected={effectiveTab === 'create'}
              className={`launcher-tab ${effectiveTab === 'create' ? 'active' : ''}`}
              onClick={() => setTab('create')}
            >
              <FaPlus aria-hidden="true" />
              <span>Create</span>
              <span className="launcher-tab-count">
                {CREATE_ACTION_GROUPS.reduce((total, group) => total + group.actions.length, 0)}
              </span>
            </button>
          )}
          <button
            type="button"
            role="tab"
            aria-selected={effectiveTab === 'explore'}
            className={`launcher-tab ${effectiveTab === 'explore' ? 'active' : ''}`}
            onClick={() => setTab('explore')}
          >
            <FaCompass aria-hidden="true" />
            <span>Explore</span>
            <span className="launcher-tab-count">
              {EXPLORE_ACTION_GROUPS.reduce((total, group) => total + group.actions.length, 0)}
            </span>
          </button>
        </div>

        <div className="launcher-search">
          <FaSearch className="launcher-search-icon" aria-hidden="true" />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={effectiveTab === 'create' ? 'Search actions to create…' : 'Search summaries and reports…'}
            aria-label="Search launcher actions"
          />
          {query && (
            <button type="button" className="launcher-search-clear" onClick={() => setQuery('')} aria-label="Clear search">
              <FaTimes aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="launcher-body">
          {resultCount === 0 ? (
            <div className="launcher-empty">
              <FaSearch aria-hidden="true" />
              <h3>No matches found</h3>
              <p>Try a different keyword such as “gold”, “budget” or “paycheck”.</p>
            </div>
          ) : (
            filteredGroups.map((group) => (
              <section key={group.id} className="launcher-group">
                <h3 className="launcher-group-label">{group.label}</h3>
                <div className="launcher-action-grid">
                  {group.actions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Link
                        key={action.key}
                        to={action.path}
                        className={`launcher-action tone-${group.tone}`}
                        onClick={onClose}
                      >
                        <span className="launcher-action-icon">
                          <Icon aria-hidden="true" />
                        </span>
                        <span className="launcher-action-copy">
                          <strong>{action.label}</strong>
                          <small>{action.description}</small>
                        </span>
                        <FaArrowRight className="launcher-action-arrow" aria-hidden="true" />
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>

        <div className="launcher-footer">
          {!canModify && (
            <span className="launcher-readonly">
              <FaLock aria-hidden="true" /> Read-only access
            </span>
          )}
          <span className="launcher-hint">
            <kbd>Esc</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
};

export default AppLauncher;
