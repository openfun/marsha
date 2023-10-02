import { render, screen } from '@testing-library/react';

import { Warnings } from './index';

describe('<Warnings />', () => {
  it('shows warnings', () => {
    const warnings = ['warning1', 'warning2'];
    render(<Warnings warnings={warnings} />);
    expect(screen.getByText('warning1')).toBeInTheDocument();
    expect(screen.getByText('warning2')).toBeInTheDocument();
  });

  it('does not show warnings', () => {
    const { container } = render(<Warnings warnings={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });
});
