import { screen } from '@testing-library/react';
import React from 'react';

import render from 'utils/tests/render';

import { Icon } from '.';

jest.mock('data/appData', () => ({
  appData: {
    static: { svg: { icons: '' } },
  },
}));

describe('<Icon />', () => {
  it('renders the relevant icon with its title', () => {
    render(<Icon name="icon-organization" title="My Icon Title" />);

    const svg = screen.getByRole('img', { name: 'My Icon Title' });
    expect(svg.innerHTML).toContain('xlink:href="#icon-organization"');
  });

  it('renders an aria-hidden icon if no title is provided', () => {
    render(<Icon name="icon-organization" />);

    const svg = screen.getByRole('img', { hidden: true });
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg.innerHTML).toContain('xlink:href="#icon-organization"');
  });
});
