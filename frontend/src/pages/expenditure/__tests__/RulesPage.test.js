// frontend/src/pages/expenditure/__tests__/RulesPage.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RulesPage from '../RulesPage';
import * as ruleService from '../../../services/categorizationRuleService';
import { expectNoA11yViolations } from '../../../../tests/a11y/expectNoA11yViolations';

jest.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/expenditures/rules' }),
}), { virtual: true });

jest.mock('../../../services/categorizationRuleService', () => ({
  getRules: jest.fn(),
  createRule: jest.fn(),
  updateRule: jest.fn(),
  deleteRule: jest.fn(),
  testRule: jest.fn(),
}));

let mockCanModifyValue = true;
jest.mock('../../../context/AuthContext', () => ({
  useCanModify: () => ({
    canModify: mockCanModifyValue,
    isViewer: !mockCanModifyValue,
    isAdmin: mockCanModifyValue,
  }),
  useAuth: () => ({ user: { role: mockCanModifyValue ? 'admin' : 'viewer' } }),
}));

jest.mock('../../../context/ToastContext', () => ({
  useToast: () => ({ showToast: jest.fn(), addToast: jest.fn() }),
}));

describe('UI Phase 4C: RulesPage Unit & Accessibility Tests', () => {
  const mockRules = [
    {
      _id: 'rule1',
      name: 'Amazon to Shopping',
      field: 'description',
      operator: 'contains',
      value: 'amazon',
      category: 'Shopping & Leisure',
      priority: 10,
      isActive: true,
    },
    {
      _id: 'rule2',
      name: 'Uber to Transportation',
      field: 'description',
      operator: 'contains',
      value: 'uber',
      category: 'Transportation',
      priority: 5,
      isActive: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockCanModifyValue = true;
    ruleService.getRules.mockResolvedValue({ data: mockRules });
  });

  const renderComponent = () => {
    return render(<RulesPage />);
  };

  test('1. Renders PageHeader, subnav, and action buttons', async () => {
    renderComponent();
    expect(screen.getByRole('heading', { name: 'Auto-Categorization Rules', level: 1 })).toBeInTheDocument();
    expect(screen.getByTestId('test-simulator-btn')).toBeInTheDocument();
    expect(screen.getByTestId('create-rule-btn')).toBeInTheDocument();

    expect(await screen.findByText('Amazon to Shopping')).toBeInTheDocument();
    expect(await screen.findByText('Uber to Transportation')).toBeInTheDocument();
  });

  test('2. Renders EmptyState when rules array is empty', async () => {
    ruleService.getRules.mockResolvedValueOnce({ data: [] });
    renderComponent();

    expect(await screen.findByText('No categorization rules configured yet')).toBeInTheDocument();
  });

  test('3. Opens create modal with default values and closes on Cancel', async () => {
    renderComponent();
    expect(await screen.findByText('Amazon to Shopping')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('create-rule-btn'));
    expect(screen.getByText('Create Categorization Rule')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);
    expect(screen.queryByText('Create Categorization Rule')).not.toBeInTheDocument();
  });

  test('4. Opens Test Simulator modal and handles match simulation', async () => {
    ruleService.testRule.mockResolvedValueOnce({ matched: true, category: 'Shopping & Leisure' });
    renderComponent();
    expect(await screen.findByText('Amazon to Shopping')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('test-simulator-btn'));
    expect(screen.getByText('Rule Test Simulator')).toBeInTheDocument();

    const sampleInput = screen.getByLabelText(/sample text to test/i);
    fireEvent.change(sampleInput, { target: { value: 'Amazon Prime' } });

    fireEvent.click(screen.getByRole('button', { name: /run match simulation/i }));

    expect(await screen.findByText('Match Found!')).toBeInTheDocument();
  });

  test('5. Passes WCAG 2.1 AA accessibility checks via jest-axe (Invariant M4a)', async () => {
    const { container } = renderComponent();
    expect(await screen.findByText('Amazon to Shopping')).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });
});
