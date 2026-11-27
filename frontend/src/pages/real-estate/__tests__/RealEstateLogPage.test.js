// frontend/src/pages/real-estate/__tests__/RealEstateLogPage.test.js
/* eslint-disable testing-library/no-container, testing-library/no-node-access */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import RealEstateLogPage from '../RealEstateLogPage';
import * as realEstateService from '../../../services/realEstateService';
import * as AuthContext from '../../../context/AuthContext';

jest.mock('react-router-dom', () => {
  return require('../../../../node_modules/react-router/dist/development/index.js');
}, { virtual: true });

expect.extend(toHaveNoViolations);

jest.mock('../../../services/realEstateService');
jest.mock('../../../context/ToastContext', () => ({
  useToast: () => ({ showToast: jest.fn(), addToast: jest.fn() }),
}));

const MOCK_PROPERTIES = [
  {
    _id: '1',
    name: 'New Cairo Apartment',
    type: 'Residential',
    area: 165,
    location: '5th Settlement, New Cairo',
    purchasePrice: 1800000,
    currentValuation: 2200000,
    purchaseDate: '2023-06-15T00:00:00.000Z',
    status: 'Owned',
    sellingPrice: 0,
    notes: 'Primary residential unit.',
  },
  {
    _id: '2',
    name: 'North Coast Chalet',
    type: 'Villa',
    area: 210,
    location: 'Ras El Hekma, North Coast',
    purchasePrice: 2000000,
    currentValuation: 1850000,
    purchaseDate: '2024-03-10T00:00:00.000Z',
    status: 'Owned',
    sellingPrice: 0,
  },
  {
    _id: '3',
    name: 'Smart Village Office',
    type: 'Commercial',
    area: 140,
    location: 'Smart Village, Giza',
    purchasePrice: 2500000,
    currentValuation: 2500000,
    purchaseDate: '2021-02-01T00:00:00.000Z',
    status: 'Sold',
    sellingPrice: 2500000,
    sellingDate: '2025-05-01T00:00:00.000Z',
  },
  {
    _id: '4',
    name: 'Downtown Retail Unit',
    type: 'Commercial',
    area: 95,
    location: 'Downtown Cairo',
    purchasePrice: 3000000,
    currentValuation: 3000000,
    purchaseDate: '2020-09-20T00:00:00.000Z',
    status: 'Sold',
    sellingPrice: 2700000,
    sellingDate: '2025-08-12T00:00:00.000Z',
  },
];

const MOCK_SUMMARY = {
  owned: {
    totalPaid: 3800000,
    totalValuation: 4050000,
    unrealizedGain: 250000,
    gainPercentage: 6.58,
    count: 2,
  },
  sold: {
    totalPaid: 5500000,
    totalSoldValue: 5200000,
    realizedGain: -300000,
    count: 2,
  },
  totalProperties: 4,
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <RealEstateLogPage />
    </MemoryRouter>
  );

describe('RealEstateLogPage (Phase 8E)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(AuthContext, 'useCanModify').mockReturnValue({
      canModify: true,
      isViewer: false,
      isAdmin: true,
      isManager: false,
      role: 'admin',
    });
    jest.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { role: 'admin', name: 'Admin User' },
      isAuthenticated: true,
    });
    realEstateService.getRealEstates.mockResolvedValue(MOCK_PROPERTIES);
    realEstateService.getRealEstateSummary.mockResolvedValue(MOCK_SUMMARY);
    realEstateService.deleteRealEstate.mockResolvedValue({ message: 'Deleted' });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders loading state initially with Loading primitive', () => {
    realEstateService.getRealEstates.mockReturnValue(new Promise(() => {}));
    realEstateService.getRealEstateSummary.mockReturnValue(new Promise(() => {}));

    renderPage();
    expect(screen.getByText(/Loading real estate portfolio/i)).toBeInTheDocument();
  });

  test('renders 4-property KPI summary with neutral figures under Option B prime', async () => {
    const { container } = renderPage();

    expect(await screen.findByText('New Cairo Apartment')).toBeInTheDocument();
    expect(screen.getByText('Capital Invested')).toBeInTheDocument();
    expect(screen.getByText('Current Portfolio Value')).toBeInTheDocument();
    expect(screen.getByText('Unrealized Capital Gain')).toBeInTheDocument();
    expect(screen.getByText(/\+6\.58% Overall Appreciation/)).toBeInTheDocument();
    expect(screen.getByText('User Valuation')).toBeInTheDocument();

    // Option B': no Delta tone primitives anywhere on the page
    expect(container.querySelector('.fs-delta')).toBeNull();
    expect(container.querySelector('.fs-delta--positive')).toBeNull();
    expect(container.querySelector('.fs-delta--negative')).toBeNull();
  });

  test('Sold-loss fixture renders neutral displayed gain with no realised-loss tone', async () => {
    const { container } = renderPage();

    expect(await screen.findByText('Downtown Retail Unit')).toBeInTheDocument();
    expect(screen.queryByText(/Realised Loss/i)).not.toBeInTheDocument();
    expect(container.querySelector('.fs-badge--negative')).toBeNull();
    expect(container.querySelector('.fs-delta--negative')).toBeNull();
  });

  test('renders neutral badges and zero emojis across Cards view', async () => {
    const { container } = renderPage();

    expect(await screen.findByText('New Cairo Apartment')).toBeInTheDocument();
    const text = container.textContent;
    expect(text).not.toMatch(/[🏠🏢🏰🏞🏘📍]/u);
  });

  test('renders accessible progress bar with neutral label and signed aria-valuetext', async () => {
    renderPage();

    expect(await screen.findByText('New Cairo Apartment')).toBeInTheDocument();

    const positiveProgress = screen.getByRole('progressbar', {
      name: /Valuation change for New Cairo Apartment/i,
    });
    expect(positiveProgress).toHaveAttribute('aria-valuetext', '+22.2%');

    const negativeProgress = screen.getByRole('progressbar', {
      name: /Valuation change for North Coast Chalet/i,
    });
    expect(negativeProgress).toHaveAttribute('aria-valuetext', '-7.5%');
  });

  test('toggles cleanly between Cards and Table views with right-aligned figures and D19 mobile cards', async () => {
    const { container } = renderPage();

    expect(await screen.findByText('New Cairo Apartment')).toBeInTheDocument();

    const tableBtn = screen.getByRole('button', { name: /Table/i });
    fireEvent.click(tableBtn);

    expect(tableBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByTestId('real-estate-mobile-cards')).toBeInTheDocument();
    expect(container.querySelector('.re-table-wrap')).toBeInTheDocument();
    expect(container.querySelectorAll('.re-td-num.fs-num').length).toBeGreaterThan(0);

    // Expand first mobile card
    const expandButtons = screen.getAllByRole('button', { name: /Show details for/i });
    fireEvent.click(expandButtons[0]);
    expect(screen.getByRole('button', { name: /Hide details for/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  test('filters by status, type, search, and sorts properties', async () => {
    renderPage();

    expect(await screen.findByText('New Cairo Apartment')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Owned' }));
    await waitFor(() => {
      expect(realEstateService.getRealEstates).toHaveBeenLastCalledWith({
        status: 'Owned',
        type: 'all',
        search: '',
      });
    });

    fireEvent.click(screen.getByRole('button', { name: 'Villa' }));
    await waitFor(() => {
      expect(realEstateService.getRealEstates).toHaveBeenLastCalledWith({
        status: 'Owned',
        type: 'Villa',
        search: '',
      });
    });

    fireEvent.change(screen.getByLabelText(/Search properties/i), {
      target: { value: 'Chalet' },
    });
    await waitFor(() => {
      expect(realEstateService.getRealEstates).toHaveBeenLastCalledWith({
        status: 'Owned',
        type: 'Villa',
        search: 'Chalet',
      });
    });

    fireEvent.change(screen.getByLabelText(/Sort By/i), { target: { value: 'name' } });
    expect(screen.getByLabelText(/Sort By/i)).toHaveValue('name');
  });

  test('opens ConfirmModal and deletes property on confirmation', async () => {
    renderPage();

    expect(await screen.findByText('New Cairo Apartment')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Delete New Cairo Apartment' }));
    expect(screen.getByText('Delete Real Estate Property')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Delete$/i }));
    await waitFor(() => {
      expect(realEstateService.deleteRealEstate).toHaveBeenCalledWith('1');
    });
  });

  test('viewer role disables ProtectedAction controls and blocks handleDelete via useCanModify', async () => {
    jest.spyOn(AuthContext, 'useCanModify').mockReturnValue({
      canModify: false,
      isViewer: true,
      isAdmin: false,
      isManager: false,
      role: 'viewer',
    });
    jest.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { role: 'viewer', name: 'Viewer User' },
      isAuthenticated: true,
    });

    renderPage();

    expect(await screen.findByText('New Cairo Apartment')).toBeInTheDocument();

    const deleteBtn = screen.getByRole('button', { name: 'Delete New Cairo Apartment' });
    expect(deleteBtn).toBeDisabled();
    fireEvent.click(deleteBtn);
    expect(screen.queryByText('Delete Real Estate Property')).not.toBeInTheDocument();
    expect(realEstateService.deleteRealEstate).not.toHaveBeenCalled();
  });

  test('renders empty state with ProtectedAction around Add Your First Property', async () => {
    realEstateService.getRealEstates.mockResolvedValue([]);
    realEstateService.getRealEstateSummary.mockResolvedValue({
      owned: { totalPaid: 0, totalValuation: 0, unrealizedGain: 0, gainPercentage: 0, count: 0 },
      sold: { totalPaid: 0, totalSoldValue: 0, realizedGain: 0, count: 0 },
      totalProperties: 0,
    });

    renderPage();

    expect(await screen.findByText('No Real Estate Properties Found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Add Your First Property/i })).toHaveAttribute(
      'href',
      '/real-estate/new'
    );
  });

  test('renders fetch error card with Retry recovery', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    realEstateService.getRealEstates.mockRejectedValueOnce(new Error('Network down'));

    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent(/Network down/i);

    realEstateService.getRealEstates.mockResolvedValueOnce(MOCK_PROPERTIES);
    fireEvent.click(screen.getByRole('button', { name: /Retry/i }));

    expect(await screen.findByText('New Cairo Apartment')).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  test('renders zero inline [style] attributes in Cards and Table views', async () => {
    const { container } = renderPage();

    expect(await screen.findByText('New Cairo Apartment')).toBeInTheDocument();
    expect(container.querySelectorAll('[style]').length).toBe(0);

    fireEvent.click(screen.getByRole('button', { name: /Table/i }));
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(container.querySelectorAll('[style]').length).toBe(0);
  });

  test('passes jest-axe with zero critical or serious violations in Cards view', async () => {
    const { container } = renderPage();

    expect(await screen.findByText('New Cairo Apartment')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('passes jest-axe with zero critical or serious violations in Table view', async () => {
    const { container } = renderPage();

    expect(await screen.findByText('New Cairo Apartment')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Table/i }));

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
