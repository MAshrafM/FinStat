// frontend/src/components/__tests__/DataLoader.test.js
import React from 'react';
import { render } from '@testing-library/react';
import DataLoader from '../DataLoader';
import * as DataContextModule from '../../context/DataContext';

jest.mock('../../context/DataContext');

describe('DataLoader Component (Phase 2D Colour Inheritance)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders with currentColor stroke on SVG progress circle, not hardcoded blue', () => {
    jest.spyOn(DataContextModule, 'useData').mockReturnValue({
      isLoading: true,
      loadingProgress: 50,
      error: null,
    });

    const { container } = render(
      <DataLoader>
        <div>Content</div>
      </DataLoader>
    );

    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(2);

    // Background circle is #e5e7eb
    expect(circles[0].getAttribute('stroke')).toBe('#e5e7eb');

    // Progress circle must be currentColor (not #3b82f6)
    const progressCircle = circles[1];
    expect(progressCircle.getAttribute('stroke')).toBe('currentColor');
    expect(progressCircle.getAttribute('stroke')).not.toBe('#3b82f6');
  });

  test('renders bouncing dots with currentColor background', () => {
    jest.spyOn(DataContextModule, 'useData').mockReturnValue({
      isLoading: true,
      loadingProgress: 50,
      error: null,
    });

    const { container } = render(
      <DataLoader>
        <div>Content</div>
      </DataLoader>
    );

    const dots = container.querySelectorAll('.dot-1, .dot-2, .dot-3');
    expect(dots.length).toBe(3);
    dots.forEach((dot) => {
      expect(dot.style.backgroundColor).toBe('currentColor');
      expect(dot.style.backgroundColor).not.toBe('rgb(59, 130, 246)');
      expect(dot.style.backgroundColor).not.toBe('#3b82f6');
    });
  });

  test('renders children when isLoading is false and no error', () => {
    jest.spyOn(DataContextModule, 'useData').mockReturnValue({
      isLoading: false,
      loadingProgress: 100,
      error: null,
    });

    const { getByText } = render(
      <DataLoader>
        <div>Loaded Content</div>
      </DataLoader>
    );

    expect(getByText('Loaded Content')).toBeInTheDocument();
  });
});

