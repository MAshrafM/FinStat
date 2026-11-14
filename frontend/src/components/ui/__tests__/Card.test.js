// frontend/src/components/ui/__tests__/Card.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import Card from '../Card';
const { expectNoA11yViolations } = require('../../../../tests/a11y/expectNoA11yViolations');

describe('Card Primitive (Phase 2E)', () => {
  it('renders default variant with children inside fs-card-body', () => {
    render(<Card>Card Body Content</Card>);
    const card = screen.getByText('Card Body Content').closest('.fs-card');
    expect(card).toBeInTheDocument();
    expect(card).not.toHaveClass('fs-card--raised');
    expect(screen.getByText('Card Body Content')).toHaveClass('fs-card-body');
  });

  it('renders raised variant when variant="raised"', () => {
    render(<Card variant="raised">Raised Content</Card>);
    const card = screen.getByText('Raised Content').closest('.fs-card');
    expect(card).toHaveClass('fs-card', 'fs-card--raised');
  });

  it('renders header and footer slots when provided', () => {
    render(
      <Card
        header={<h3>Card Header</h3>}
        footer={<button type="button">Action</button>}
      >
        Main Content
      </Card>
    );

    const header = screen.getByText('Card Header').closest('.fs-card-header');
    const footer = screen.getByRole('button', { name: /action/i }).closest('.fs-card-footer');

    expect(header).toBeInTheDocument();
    expect(footer).toBeInTheDocument();
    expect(screen.getByText('Main Content')).toHaveClass('fs-card-body');
  });

  it('propagates additional className and attributes', () => {
    render(
      <Card className="custom-card-class" data-testid="test-card">
        Test Content
      </Card>
    );
    const card = screen.getByTestId('test-card');
    expect(card).toHaveClass('fs-card', 'custom-card-class');
  });

  it('passes accessibility audits without violations', async () => {
    const { container } = render(
      <Card
        header={<h2>Accessible Card</h2>}
        footer={<button type="button">Close</button>}
      >
        Accessible body text.
      </Card>
    );
    await expectNoA11yViolations(container);
  });
});
