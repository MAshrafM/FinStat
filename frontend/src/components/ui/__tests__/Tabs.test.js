// frontend/src/components/ui/__tests__/Tabs.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Tabs from '../Tabs';
const { expectNoA11yViolations } = require('../../../../tests/a11y/expectNoA11yViolations');

describe('Tabs Primitive (Phase 2E)', () => {
  const sampleTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'reports', label: 'Reports', disabled: true },
    { id: 'settings', label: 'Settings' },
  ];

  it('renders tablist with default horizontal orientation and tab buttons', () => {
    render(
      <Tabs
        tabs={sampleTabs}
        activeTab="overview"
        onChange={jest.fn()}
        ariaLabel="Dashboard Views"
      />
    );

    const tablist = screen.getByRole('tablist', { name: 'Dashboard Views' });
    expect(tablist).toHaveAttribute('aria-orientation', 'horizontal');

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(4);

    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[0]).toHaveAttribute('tabIndex', '0');
    expect(tabs[0]).toHaveClass('fs-tab--active');

    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
    expect(tabs[1]).toHaveAttribute('tabIndex', '-1');
    expect(tabs[1]).not.toHaveClass('fs-tab--active');

    expect(tabs[2]).toBeDisabled();
    expect(tabs[2]).toHaveAttribute('aria-disabled', 'true');
  });

  it('sets aria-orientation="vertical" when orientation="vertical"', () => {
    render(
      <Tabs
        tabs={sampleTabs}
        activeTab="overview"
        onChange={jest.fn()}
        ariaLabel="Settings Navigation"
        orientation="vertical"
      />
    );
    const tablist = screen.getByRole('tablist', { name: 'Settings Navigation' });
    expect(tablist).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('calls onChange when an enabled tab is clicked', () => {
    const handleChange = jest.fn();
    render(
      <Tabs
        tabs={sampleTabs}
        activeTab="overview"
        onChange={handleChange}
        ariaLabel="Navigation"
      />
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Analytics' }));
    expect(handleChange).toHaveBeenCalledWith('analytics');

    // Clicking disabled tab should not trigger onChange
    fireEvent.click(screen.getByRole('tab', { name: 'Reports' }));
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('navigates with ArrowRight and ArrowLeft in horizontal mode, skipping disabled tabs and inert to vertical arrows', () => {
    render(
      <Tabs
        tabs={sampleTabs}
        activeTab="overview"
        onChange={jest.fn()}
        ariaLabel="Horizontal Nav"
        orientation="horizontal"
      />
    );

    const [overviewTab, analyticsTab, , settingsTab] = screen.getAllByRole('tab');

    overviewTab.focus();
    expect(document.activeElement).toBe(overviewTab);

    // ArrowRight moves from overview (0) to analytics (1)
    fireEvent.keyDown(overviewTab, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(analyticsTab);

    // ArrowRight moves from analytics (1) skipping reports (2, disabled) to settings (3)
    fireEvent.keyDown(analyticsTab, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(settingsTab);

    // ArrowRight wraps from settings (3) to overview (0)
    fireEvent.keyDown(settingsTab, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(overviewTab);

    // ArrowLeft wraps backwards from overview (0) skipping reports (2, disabled) to settings (3)
    fireEvent.keyDown(overviewTab, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(settingsTab);

    // Vertical arrows should be inert in horizontal mode
    fireEvent.keyDown(settingsTab, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(settingsTab);
    fireEvent.keyDown(settingsTab, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(settingsTab);
  });

  it('navigates with ArrowDown and ArrowUp in vertical mode, skipping disabled tabs and inert to horizontal arrows', () => {
    render(
      <Tabs
        tabs={sampleTabs}
        activeTab="overview"
        onChange={jest.fn()}
        ariaLabel="Vertical Nav"
        orientation="vertical"
      />
    );

    const [overviewTab, analyticsTab, , settingsTab] = screen.getAllByRole('tab');

    overviewTab.focus();
    expect(document.activeElement).toBe(overviewTab);

    // ArrowDown moves from overview (0) to analytics (1)
    fireEvent.keyDown(overviewTab, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(analyticsTab);

    // ArrowDown moves from analytics (1) skipping reports (2, disabled) to settings (3)
    fireEvent.keyDown(analyticsTab, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(settingsTab);

    // ArrowDown wraps from settings (3) to overview (0)
    fireEvent.keyDown(settingsTab, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(overviewTab);

    // ArrowUp wraps backwards from overview (0) skipping reports (2) to settings (3)
    fireEvent.keyDown(overviewTab, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(settingsTab);

    // Horizontal arrows should be inert in vertical mode
    fireEvent.keyDown(settingsTab, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(settingsTab);
    fireEvent.keyDown(settingsTab, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(settingsTab);
  });

  it('handles Home and End keys to jump to first and last enabled tabs', () => {
    render(
      <Tabs
        tabs={sampleTabs}
        activeTab="overview"
        onChange={jest.fn()}
        ariaLabel="Nav"
      />
    );

    const [overviewTab, analyticsTab, , settingsTab] = screen.getAllByRole('tab');

    analyticsTab.focus();
    expect(document.activeElement).toBe(analyticsTab);

    // End jumps to settings (last enabled)
    fireEvent.keyDown(analyticsTab, { key: 'End' });
    expect(document.activeElement).toBe(settingsTab);

    // Home jumps to overview (first enabled)
    fireEvent.keyDown(settingsTab, { key: 'Home' });
    expect(document.activeElement).toBe(overviewTab);
  });

  it('activates focused tab on Enter or Space key', () => {
    const handleChange = jest.fn();
    render(
      <Tabs
        tabs={sampleTabs}
        activeTab="overview"
        onChange={handleChange}
        ariaLabel="Nav"
      />
    );

    const [, analyticsTab] = screen.getAllByRole('tab');
    analyticsTab.focus();

    fireEvent.keyDown(analyticsTab, { key: 'Enter' });
    expect(handleChange).toHaveBeenCalledWith('analytics');

    fireEvent.keyDown(analyticsTab, { key: ' ' });
    expect(handleChange).toHaveBeenCalledWith('analytics');
  });

  it('passes accessibility audits without violations', async () => {
    const tabsWithPanels = [
      { id: 'overview', label: 'Overview', panelId: 'tabpanel-overview' },
      { id: 'analytics', label: 'Analytics', panelId: 'tabpanel-analytics' },
    ];
    const { container } = render(
      <div>
        <Tabs
          tabs={tabsWithPanels}
          activeTab="overview"
          onChange={jest.fn()}
          ariaLabel="Primary Views"
        />
        <div id="tabpanel-overview" role="tabpanel" aria-labelledby="tab-overview">
          Overview panel content
        </div>
        <div id="tabpanel-analytics" role="tabpanel" aria-labelledby="tab-analytics" hidden>
          Analytics panel content
        </div>
      </div>
    );
    await expectNoA11yViolations(container);
  });
});
