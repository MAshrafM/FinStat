// frontend/src/pages/real-estate/__tests__/RealEstateForm.test.js
/* eslint-disable testing-library/no-container, testing-library/no-node-access */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import RealEstateForm from '../RealEstateForm';
import AddRealEstatePage from '../AddRealEstatePage';
import EditRealEstatePage from '../EditRealEstatePage';
import * as realEstateService from '../../../services/realEstateService';

jest.mock('react-router-dom', () => {
  return require('../../../../node_modules/react-router/dist/development/index.js');
}, { virtual: true });

expect.extend(toHaveNoViolations);

jest.mock('../../../services/realEstateService');

const SAMPLE_PROPERTY = {
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
  notes: 'Primary unit',
};

describe('RealEstateForm, AddRealEstatePage & EditRealEstatePage (Phase 8E)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    realEstateService.createRealEstate.mockResolvedValue({ _id: 'new-1' });
    realEstateService.getRealEstateById.mockResolvedValue(SAMPLE_PROPERTY);
    realEstateService.updateRealEstate.mockResolvedValue({ ...SAMPLE_PROPERTY, name: 'Updated' });
  });

  test('pairs explicit id/htmlFor labels across all 11 fields including conditional Sold fields', () => {
    render(
      <MemoryRouter>
        <RealEstateForm onSubmit={jest.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/Property Name/i)).toHaveAttribute('id', 're-name');
    expect(screen.getByLabelText(/Property Type/i)).toHaveAttribute('id', 're-type');
    expect(screen.getByLabelText(/Area \(m²\)/i)).toHaveAttribute('id', 're-area');
    expect(screen.getByLabelText(/Location \/ Address/i)).toHaveAttribute('id', 're-location');
    expect(screen.getByLabelText(/Purchase Price \(EGP\)/i)).toHaveAttribute('id', 're-purchase-price');
    expect(screen.getByLabelText(/Current Market Valuation \(EGP\)/i)).toHaveAttribute('id', 're-current-valuation');
    expect(screen.getByLabelText(/Purchase Date/i)).toHaveAttribute('id', 're-purchase-date');
    expect(screen.getByLabelText(/^Status$/i)).toHaveAttribute('id', 're-status');
    expect(screen.getByLabelText(/Notes & Details/i)).toHaveAttribute('id', 're-notes');

    fireEvent.change(screen.getByLabelText(/^Status$/i), { target: { value: 'Sold' } });
    expect(screen.getByLabelText(/Selling Price \(EGP\)/i)).toHaveAttribute('id', 're-selling-price');
    expect(screen.getByLabelText(/Selling Date/i)).toHaveAttribute('id', 're-selling-date');
  });

  test('validates required fields and negative area on blur and clears on valid blur', () => {
    render(
      <MemoryRouter>
        <RealEstateForm onSubmit={jest.fn()} />
      </MemoryRouter>
    );

    const nameInput = screen.getByLabelText(/Property Name/i);
    fireEvent.blur(nameInput);
    expect(screen.getByText('Property name is required')).toBeInTheDocument();
    expect(nameInput).toHaveAttribute('aria-invalid', 'true');
    expect(nameInput).toHaveAttribute('aria-describedby', 're-name-error');

    fireEvent.change(nameInput, { target: { value: 'Maadi Loft' } });
    fireEvent.blur(nameInput);
    expect(screen.queryByText('Property name is required')).not.toBeInTheDocument();
    expect(nameInput).toHaveAttribute('aria-invalid', 'false');
    expect(nameInput).not.toHaveAttribute('aria-describedby');

    const areaInput = screen.getByLabelText(/Area \(m²\)/i);
    fireEvent.change(areaInput, { target: { value: '-10' } });
    fireEvent.blur(areaInput);
    expect(screen.getByText('Area cannot be negative')).toBeInTheDocument();
    expect(areaInput).toHaveAttribute('aria-describedby', 're-area-error');

    fireEvent.change(areaInput, { target: { value: '120' } });
    fireEvent.blur(areaInput);
    expect(screen.queryByText('Area cannot be negative')).not.toBeInTheDocument();
    expect(areaInput).toHaveAttribute('aria-describedby', 're-area-hint');
  });

  test('shows distinct error summary on invalid submit and blocks onSubmit', () => {
    const handleSubmit = jest.fn();
    render(
      <MemoryRouter>
        <RealEstateForm onSubmit={handleSubmit} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Add Property/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/Please fix the/i);
    expect(screen.getByText('Property name is required')).toBeInTheDocument();
    expect(screen.getByText('Purchase price must be greater than 0')).toBeInTheDocument();
    expect(screen.getByText('Current valuation cannot be negative')).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  test('enforces client-only conditional Sold validation and clears errors when switching back to Owned', () => {
    const handleSubmit = jest.fn();
    render(
      <MemoryRouter>
        <RealEstateForm onSubmit={handleSubmit} />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Property Name/i), { target: { value: 'Sold Unit' } });
    fireEvent.change(screen.getByLabelText(/Purchase Price \(EGP\)/i), { target: { value: '1000000' } });
    fireEvent.change(screen.getByLabelText(/Current Market Valuation \(EGP\)/i), { target: { value: '1200000' } });
    fireEvent.change(screen.getByLabelText(/^Status$/i), { target: { value: 'Sold' } });

    fireEvent.click(screen.getByRole('button', { name: /Add Property/i }));
    expect(screen.getByText('Selling price is required for sold properties')).toBeInTheDocument();
    expect(screen.getByText('Selling date is required for sold properties')).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();

    // Switching back to Owned immediately clears Sold field errors
    fireEvent.change(screen.getByLabelText(/^Status$/i), { target: { value: 'Owned' } });
    expect(screen.queryByText('Selling price is required for sold properties')).not.toBeInTheDocument();
    expect(screen.queryByText('Selling date is required for sold properties')).not.toBeInTheDocument();
  });

  test('submits byte-identical payload shape matching backend contract', () => {
    const handleSubmit = jest.fn();
    render(
      <MemoryRouter>
        <RealEstateForm onSubmit={handleSubmit} />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Property Name/i), { target: { value: 'New Cairo Apt' } });
    fireEvent.change(screen.getByLabelText(/Area \(m²\)/i), { target: { value: '150' } });
    fireEvent.change(screen.getByLabelText(/Location \/ Address/i), { target: { value: 'New Cairo' } });
    fireEvent.change(screen.getByLabelText(/Purchase Price \(EGP\)/i), { target: { value: '1500000' } });
    fireEvent.change(screen.getByLabelText(/Current Market Valuation \(EGP\)/i), { target: { value: '2000000' } });
    fireEvent.change(screen.getByLabelText(/Purchase Date/i), { target: { value: '2025-01-10' } });
    fireEvent.change(screen.getByLabelText(/Notes & Details/i), { target: { value: 'Corner unit' } });

    fireEvent.click(screen.getByRole('button', { name: /Add Property/i }));

    expect(handleSubmit).toHaveBeenCalledWith({
      name: 'New Cairo Apt',
      type: 'Residential',
      area: 150,
      location: 'New Cairo',
      purchasePrice: 1500000,
      currentValuation: 2000000,
      purchaseDate: '2025-01-10',
      status: 'Owned',
      sellingPrice: 0,
      sellingDate: undefined,
      notes: 'Corner unit',
    });
  });

  test('AddRealEstatePage submits payload and displays .re-submit-error on failure', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    realEstateService.createRealEstate.mockRejectedValueOnce(new Error('Create failed'));

    render(
      <MemoryRouter>
        <AddRealEstatePage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Property Name/i), { target: { value: 'Test Villa' } });
    fireEvent.change(screen.getByLabelText(/Purchase Price \(EGP\)/i), { target: { value: '3000000' } });
    fireEvent.change(screen.getByLabelText(/Current Market Valuation \(EGP\)/i), { target: { value: '3500000' } });
    fireEvent.click(screen.getByRole('button', { name: /Add Property/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Create failed');
    consoleSpy.mockRestore();
  });

  test('EditRealEstatePage shows loading state, prefills form synchronously, and updates property', async () => {
    render(
      <MemoryRouter initialEntries={['/real-estate/edit/1']}>
        <Routes>
          <Route path="/real-estate/edit/:id" element={<EditRealEstatePage />} />
          <Route path="/real-estate" element={<div>Real Estate List</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Loading property details/i)).toBeInTheDocument();

    const nameInput = await screen.findByLabelText(/Property Name/i);
    expect(nameInput).toHaveValue('New Cairo Apartment');

    fireEvent.change(nameInput, { target: { value: 'New Cairo Penthouse' } });
    fireEvent.click(screen.getByRole('button', { name: /Update Property/i }));

    await waitFor(() => {
      expect(realEstateService.updateRealEstate).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ name: 'New Cairo Penthouse', purchasePrice: 1800000 })
      );
    });
  });

  test('EditRealEstatePage renders fetch error card with Retry recovery', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    realEstateService.getRealEstateById.mockRejectedValueOnce(new Error('Load failed'));

    render(
      <MemoryRouter initialEntries={['/real-estate/edit/1']}>
        <Routes>
          <Route path="/real-estate/edit/:id" element={<EditRealEstatePage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Load failed');

    realEstateService.getRealEstateById.mockResolvedValueOnce(SAMPLE_PROPERTY);
    fireEvent.click(screen.getByRole('button', { name: /Retry/i }));

    expect(await screen.findByDisplayValue('New Cairo Apartment')).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  test('EditRealEstatePage renders not-found empty card when property is null', async () => {
    realEstateService.getRealEstateById.mockResolvedValueOnce(null);

    render(
      <MemoryRouter initialEntries={['/real-estate/edit/999']}>
        <Routes>
          <Route path="/real-estate/edit/:id" element={<EditRealEstatePage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Property Not Found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Return to Real Estate/i })).toHaveAttribute(
      'href',
      '/real-estate'
    );
  });

  test('renders zero inline [style] attributes across Add and Edit pages', async () => {
    const { container: addContainer } = render(
      <MemoryRouter>
        <AddRealEstatePage />
      </MemoryRouter>
    );
    expect(addContainer.querySelectorAll('[style]').length).toBe(0);

    const { container: editContainer } = render(
      <MemoryRouter initialEntries={['/real-estate/edit/1']}>
        <Routes>
          <Route path="/real-estate/edit/:id" element={<EditRealEstatePage />} />
        </Routes>
      </MemoryRouter>
    );
    await screen.findByDisplayValue('New Cairo Apartment');
    expect(editContainer.querySelectorAll('[style]').length).toBe(0);
  });

  test('AddRealEstatePage passes jest-axe with zero violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <AddRealEstatePage />
      </MemoryRouter>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('EditRealEstatePage passes jest-axe with zero violations', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/real-estate/edit/1']}>
        <Routes>
          <Route path="/real-estate/edit/:id" element={<EditRealEstatePage />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByDisplayValue('New Cairo Apartment');
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
