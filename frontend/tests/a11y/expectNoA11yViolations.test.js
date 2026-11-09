/**
 * @jest-environment jsdom
 */

const { expectNoA11yViolations } = require('./expectNoA11yViolations');

describe('expectNoA11yViolations', () => {
  it('passes on an accessible button with text content', async () => {
    const container = document.createElement('div');
    container.innerHTML = '<button type="button">Save</button>';
    await expect(expectNoA11yViolations(container)).resolves.not.toThrow();
  });

  it('fails on an empty button missing an accessible name', async () => {
    const container = document.createElement('div');
    container.innerHTML = '<button type="button"></button>';
    await expect(expectNoA11yViolations(container)).rejects.toThrow();
  });
});
