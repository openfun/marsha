import { screen, render } from '@testing-library/react';
import { normalizeColor } from 'grommet/utils';
import { createMemoryHistory } from 'history';
import React from 'react';
import { BrowserRouter, Router } from 'react-router-dom';

import { routes } from 'routes';
import { themeExtend } from 'styles/theme.extend';

import MenuItem from './MenuItem';

describe('<MenuItem />', () => {
  test('renders MenuItem', () => {
    const { container } = render(
      <MenuItem route={routes.HomePage}>My Content</MenuItem>,
      {
        wrapper: BrowserRouter,
      },
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByText(/My Content/i)).toBeInTheDocument();
    expect(
      screen.getByRole(/menuitem/i, { name: /Dashboard/i }),
    ).toBeInTheDocument();
  });

  test('test active link', () => {
    const history = createMemoryHistory();
    history.push(routes.HomePage.path);
    const { rerender } = render(
      <Router history={history}>
        <MenuItem route={routes.HomePage} />
        <MenuItem route={routes.Favorites} />
      </Router>,
    );

    expect(screen.getByRole(/menuitem/i, { name: /Dashboard/i })).toHaveStyle({
      backgroundColor: normalizeColor('bg-menu-hover', themeExtend),
    });
    expect(
      screen.getByRole(/menuitem/i, { name: /Favorites/i }),
    ).not.toHaveStyle({
      backgroundColor: normalizeColor('bg-menu-hover', themeExtend),
    });

    history.push(routes.Favorites.path);
    rerender(
      <Router history={history}>
        <MenuItem route={routes.HomePage} />
        <MenuItem route={routes.Favorites} />
      </Router>,
    );

    expect(
      screen.getByRole(/menuitem/i, { name: /Dashboard/i }),
    ).not.toHaveStyle({
      backgroundColor: normalizeColor('bg-menu-hover', themeExtend),
    });
    expect(screen.getByRole(/menuitem/i, { name: /Favorites/i })).toHaveStyle({
      backgroundColor: normalizeColor('bg-menu-hover', themeExtend),
    });
  });
});
