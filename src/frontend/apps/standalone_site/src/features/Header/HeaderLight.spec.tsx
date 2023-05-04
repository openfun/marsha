import { screen } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

import { HeaderLight, HeaderLightLink } from './HeaderLight';

jest.mock('assets/svg/logo_marsha.svg', () => ({
  ReactComponent: () => <div>My LogoIcon</div>,
}));

describe('<HeaderLight />', () => {
  test('renders HeaderLight', () => {
    render(<HeaderLight />);
    expect(screen.getByRole(/menubar/i)).toBeInTheDocument();
    expect(screen.getByText(/My LogoIcon/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('link', {
        name: /My LogoIcon/i,
      }),
    ).not.toBeInTheDocument();
  });

  test('renders HeaderLightLink', () => {
    render(<HeaderLightLink />);
    expect(screen.getByRole(/menubar/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: /My LogoIcon/i,
      }),
    ).toBeInTheDocument();
  });
});
