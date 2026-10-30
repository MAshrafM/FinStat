// frontend/src/components/common/__tests__/DebouncedSearchInput.test.js
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import DebouncedSearchInput from '../DebouncedSearchInput';

describe('DebouncedSearchInput Component Tests [GAP-013]', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders with initial external value', () => {
    render(
      <DebouncedSearchInput
        value="initial text"
        onChange={jest.fn()}
        placeholder="Search..."
      />
    );

    const input = screen.getByRole('searchbox');
    expect(input.value).toBe('initial text');
    expect(input).toHaveAttribute('placeholder', 'Search...');
  });

  test('updates input display immediately upon typing', () => {
    render(<DebouncedSearchInput value="" onChange={jest.fn()} />);

    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'C' } });

    expect(input.value).toBe('C');
  });

  test('no onChange fires before 300ms has elapsed', () => {
    const onChange = jest.fn();
    render(<DebouncedSearchInput value="" onChange={onChange} delay={300} />);

    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'COMI' } });

    act(() => {
      jest.advanceTimersByTime(299);
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  test('3 rapid keystrokes within 300ms fire onChange once at 300ms', () => {
    const onChange = jest.fn();
    render(<DebouncedSearchInput value="" onChange={onChange} delay={300} />);

    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'C' } });
    act(() => {
      jest.advanceTimersByTime(100);
    });

    fireEvent.change(input, { target: { value: 'CO' } });
    act(() => {
      jest.advanceTimersByTime(100);
    });

    fireEvent.change(input, { target: { value: 'COM' } });
    expect(onChange).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('COM');
  });

  test('fires onChange immediately when input is cleared without waiting 300ms', () => {
    const onChange = jest.fn();
    render(<DebouncedSearchInput value="existing" onChange={onChange} delay={300} />);

    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: '' } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('');
  });

  test('clears input and calls onChange immediately when Escape key is pressed', () => {
    const onChange = jest.fn();
    render(<DebouncedSearchInput value="existing" onChange={onChange} delay={300} />);

    const input = screen.getByRole('searchbox');
    fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });

    expect(input.value).toBe('');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('');
  });
});
