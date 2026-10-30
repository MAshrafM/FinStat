// frontend/src/components/common/DebouncedSearchInput.js
import React, { useState, useEffect, useRef } from 'react';

const DebouncedSearchInput = ({
  value: externalValue = '',
  onChange,
  delay = 300,
  placeholder = 'Search...',
  className = 'form-control',
  style = {},
  ariaLabel = 'Search',
  onKeyDown,
  ...rest
}) => {
  const [inputValue, setInputValue] = useState(externalValue);
  const isFirstRender = useRef(true);
  const onChangeRef = useRef(onChange);

  // Keep latest onChange ref without restarting timer
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Sync with external value changes (e.g., parent reset)
  useEffect(() => {
    if (externalValue !== inputValue) {
      setInputValue(externalValue);
    }
  }, [externalValue]);

  // Debounced callback
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Immediate execution when cleared
    if (inputValue === '') {
      if (inputValue !== externalValue) {
        onChangeRef.current('');
      }
      return;
    }

    const timer = setTimeout(() => {
      if (inputValue !== externalValue) {
        onChangeRef.current(inputValue);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [inputValue, delay, externalValue]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setInputValue(''); // Effect will execute onChangeRef.current('') once immediately
    }
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  return (
    <input
      type="search"
      role="searchbox"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={className}
      style={style}
      aria-label={ariaLabel}
      autoComplete="off"
      {...rest}
    />
  );
};

export default DebouncedSearchInput;
