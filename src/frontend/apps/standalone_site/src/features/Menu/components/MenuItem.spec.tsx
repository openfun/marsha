import { screen } from '@testing-library/react';
import { normalizeColor } from 'grommet/utils';
import { theme } from 'lib-common';
import { render } from 'lib-tests';
import { Fragment } from 'react';

import { routes } from 'routes';

import MenuItem from './MenuItem';

describe('<MenuItem />', () => {
  test('renders MenuItem', () => {
    render(<MenuItem route={routes.HOMEPAGE}>My Content</MenuItem>);
    expect(
      screen.getByRole('img', { name: /svg-menu-homepage/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/My Content/i)).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /Dashboard/i }),
    ).toBeInTheDocument();
  });

  test('active link', () => {
    const { unmount } = render(
      <Fragment>
        <MenuItem route={routes.HOMEPAGE} />
        <MenuItem route={routes.PROFILE} />
      </Fragment>,
      {
        routerOptions: {
          componentPath: routes.HOMEPAGE.path,
          history: [routes.HOMEPAGE.path],
        },
      },
    );

    expect(screen.getByRole('menuitem', { name: /Dashboard/i })).toHaveStyle({
      backgroundColor: normalizeColor('bg-menu-hover', theme),
    });
    expect(
      screen.getByRole('menuitem', { name: /My Profile/i }),
    ).not.toHaveStyle({
      backgroundColor: normalizeColor('bg-menu-hover', theme),
    });

    unmount();

    render(
      <Fragment>
        <MenuItem route={routes.HOMEPAGE} />
        <MenuItem route={routes.PROFILE} />
      </Fragment>,
      {
        routerOptions: {
          componentPath: routes.PROFILE.path,
          history: [routes.PROFILE.path],
        },
      },
    );

    expect(
      screen.getByRole('menuitem', { name: /Dashboard/i }),
    ).not.toHaveStyle({
      backgroundColor: normalizeColor('bg-menu-hover', theme),
    });
    expect(screen.getByRole('menuitem', { name: /My Profile/i })).toHaveStyle({
      backgroundColor: normalizeColor('bg-menu-hover', theme),
    });
  });
});
