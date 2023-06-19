import { screen } from '@testing-library/react';
import { normalizeColor } from 'grommet/utils';
import { createMemoryHistory } from 'history';
import { theme } from 'lib-common';
import { render } from 'lib-tests';
import React from 'react';
import { BrowserRouter, Router } from 'react-router-dom';

import { routes } from 'routes';

import MenuItem from './MenuItem';

describe('<MenuItem />', () => {
  test('renders MenuItem', () => {
    render(<MenuItem route={routes.HOMEPAGE}>My Content</MenuItem>, {
      testingLibraryOptions: { wrapper: BrowserRouter },
    });
    expect(
      screen.getByRole('img', { name: /svg-menu-homepage/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/My Content/i)).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /Dashboard/i }),
    ).toBeInTheDocument();
  });

  test('active link', () => {
    const history = createMemoryHistory();
    history.push(routes.HOMEPAGE.path);
    const { rerender } = render(
      <Router history={history}>
        <MenuItem route={routes.HOMEPAGE} />
        <MenuItem route={routes.FAVORITE} />
      </Router>,
    );

    expect(screen.getByRole('menuitem', { name: /Dashboard/i })).toHaveStyle({
      backgroundColor: normalizeColor('bg-menu-hover', theme),
    });
    expect(
      screen.getByRole('menuitem', { name: /Favorites/i }),
    ).not.toHaveStyle({
      backgroundColor: normalizeColor('bg-menu-hover', theme),
    });

    history.push(routes.FAVORITE.path);
    rerender(
      <Router history={history}>
        <MenuItem route={routes.HOMEPAGE} />
        <MenuItem route={routes.FAVORITE} />
      </Router>,
    );

    expect(
      screen.getByRole('menuitem', { name: /Dashboard/i }),
    ).not.toHaveStyle({
      backgroundColor: normalizeColor('bg-menu-hover', theme),
    });
    expect(screen.getByRole('menuitem', { name: /Favorites/i })).toHaveStyle({
      backgroundColor: normalizeColor('bg-menu-hover', theme),
    });
  });
});
