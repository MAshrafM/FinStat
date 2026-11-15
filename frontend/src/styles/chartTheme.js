/**
 * frontend/src/styles/chartTheme.js
 *
 * Theme-aware chart engine adhering to:
 * - D22 Constraint 3: Multi-theme door preservation via computed token reading
 * - §4.12: Series discipline and accessible canvas labeling
 * - §4.3.2 Rule 6: Accent #14b8a6 is strictly banned as a chart series
 */

export function getTokenValue(name, fallback) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return fallback;
  const styles = getComputedStyle(document.documentElement);
  const value = styles.getPropertyValue(name).trim();
  if (!value || !/^(#[0-9a-f]{3,8}|rgba?\(|hsla?\()/i.test(value)) {
    return fallback;
  }
  return value;
}

export function getChartPalette() {
  const grey1 = getTokenValue('--fs-chart-grey-1', '#8b929b');
  const grey2 = getTokenValue('--fs-chart-grey-2', '#b8bec6');
  const grey3 = getTokenValue('--fs-chart-grey-3', '#6a7078');
  const grey4 = getTokenValue('--fs-chart-grey-4', '#d5d9dd');
  const positive = getTokenValue('--fs-positive', '#4fa87c');
  const negative = getTokenValue('--fs-negative', '#d97076');
  const warning = getTokenValue('--fs-warning', '#cfa24f');

  return {
    greys: [grey1, grey2, grey3, grey4],
    positive,
    negative,
    warning,
    grey1,
    grey2,
    grey3,
    grey4,
  };
}

export function withAlpha(color, alpha = 1) {
  if (!color) return `rgba(0, 0, 0, ${alpha})`;
  if (color.startsWith('#')) {
    let hex = color.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
  }
  if (color.startsWith('rgba(')) {
    return color.replace(/,[\s\d.]+\)$/, `, ${alpha})`);
  }
  return color;
}

export function baseChartOptions(overrides = {}) {
  const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
  const isVisualTest = typeof window !== 'undefined' && Boolean(window.__VISUAL_TEST__);
  const disableAnimation = isTest || isVisualTest;

  const borderColor = getTokenValue('--fs-border', '#34383f');
  const text3 = getTokenValue('--fs-text-3', '#a2a8b0');
  const text2 = getTokenValue('--fs-text-2', '#c9cdd3');
  const surface = getTokenValue('--fs-surface', '#1a1c20');
  const text = getTokenValue('--fs-text', '#f2f3f5');

  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: disableAnimation ? false : { duration: 400 },
    plugins: {
      legend: {
        labels: {
          color: text2,
          font: { family: 'IBM Plex Sans, -apple-system, sans-serif', size: 12 },
        },
      },
      tooltip: {
        backgroundColor: surface,
        borderColor,
        borderWidth: 1,
        titleColor: text,
        bodyColor: text2,
        padding: 10,
        cornerRadius: 6,
      },
      ...overrides.plugins,
    },
    scales: {
      x: {
        grid: { color: borderColor },
        ticks: { color: text3, font: { family: 'IBM Plex Sans, -apple-system, sans-serif' } },
        ...overrides.scales?.x,
      },
      y: {
        grid: { color: borderColor },
        ticks: { color: text3, font: { family: 'IBM Plex Sans, -apple-system, sans-serif' } },
        ...overrides.scales?.y,
      },
      ...overrides.scales,
    },
    ...overrides,
  };
}

export function doughnutDefaults(overrides = {}) {
  const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
  const isVisualTest = typeof window !== 'undefined' && Boolean(window.__VISUAL_TEST__);
  const disableAnimation = isTest || isVisualTest;

  const borderColor = getTokenValue('--fs-surface', '#16181d');
  const text = getTokenValue('--fs-text', '#f2f3f5');
  const text2 = getTokenValue('--fs-text-2', '#c9cdd3');
  const surface = getTokenValue('--fs-surface', '#1a1c20');
  const border = getTokenValue('--fs-border', '#34383f');

  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    animation: disableAnimation ? false : { animateRotate: true, duration: 400 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: surface,
        borderColor: border,
        borderWidth: 1,
        padding: 10,
        cornerRadius: 6,
        titleColor: text,
        bodyColor: text2,
      },
      ...overrides.plugins,
    },
    elements: {
      arc: {
        borderWidth: 2,
        borderColor,
      },
      ...overrides.elements?.arc,
    },
    ...overrides,
  };
}

export function ariaLabel(seriesName, dataPoints = []) {
  if (!dataPoints || dataPoints.length === 0) {
    return `${seriesName} chart with no data.`;
  }
  const summary = dataPoints
    .slice(0, 4)
    .map((dp) => (typeof dp === 'object' && dp !== null ? `${dp.label || dp.name}: ${dp.value || dp.val}` : `${dp}`))
    .join(', ');
  return `${seriesName} chart showing: ${summary}.`;
}

export function createPattern(type, color) {
  if (typeof document === 'undefined') return color;
  try {
    const canvas = document.createElement('canvas');
    if (!canvas || typeof canvas.getContext !== 'function') return color;
    canvas.width = 10;
    canvas.height = 10;
    const ctx = canvas.getContext('2d');
    if (!ctx) return color;

    ctx.fillStyle = color;
    if (type === 'dots') {
      ctx.beginPath();
      ctx.arc(5, 5, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'lines') {
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo(10, 0);
      ctx.stroke();
    } else {
      ctx.fillRect(0, 0, 10, 10);
    }
    return ctx.createPattern(canvas, 'repeat') || color;
  } catch (e) {
    return color;
  }
}
