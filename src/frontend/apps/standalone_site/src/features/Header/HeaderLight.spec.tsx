import { render, screen } from '@testing-library/react';
import React from 'react';

import HeaderLight from './HeaderLight';

jest.mock('assets/svg/logo_marsha.svg', () => ({
  ReactComponent: () => <div>My LogoIcon</div>,
}));

describe('<HeaderLight />', () => {
  test('renders HeaderLight', () => {
    render(<HeaderLight />);
    expect(screen.getByRole(/menubar/i)).toBeInTheDocument();
    expect(screen.getByText(/My LogoIcon/i)).toBeInTheDocument();
  });
});
