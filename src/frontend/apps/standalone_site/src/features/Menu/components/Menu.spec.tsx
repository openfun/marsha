import { screen, fireEvent } from '@testing-library/react';
import { render } from 'lib-tests';
import React, { Fragment } from 'react';
import { BrowserRouter } from 'react-router-dom';

import Burger from './Burger/Burger';
import Menu from './Menu';

describe('<Menu />', () => {
  test('renders Menu', () => {
    render(<Menu />, { testingLibraryOptions: { wrapper: BrowserRouter } });
    expect(
      screen.getByRole(/menuitem/i, { name: /Favorites/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole(/menuitem/i, { name: /My Contents/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole(/menuitem/i, { name: /Videos/i }),
    ).toBeInTheDocument();
  });

  test('test menu opening state', () => {
    render(
      <Fragment>
        <Burger />
        <Menu />
      </Fragment>,
      { testingLibraryOptions: { wrapper: BrowserRouter } },
    );

    const menu = screen.getByRole('menu');
    expect(menu).not.toHaveStyle('margin-left: -18.75rem;');
    fireEvent.click(screen.getByRole(/button/i));
    expect(menu).toHaveStyle('margin-left: -18.75rem;');
  });
});
