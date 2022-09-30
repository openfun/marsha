import { screen } from '@testing-library/react';
import { Grommet } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { render } from 'lib-tests';
import React from 'react';

import { themeExtend } from 'styles/theme.extend';

import MenuItem from './MenuItem';

describe('<MenuItem />', () => {
  test('renders MenuItem', () => {
    render(
      <MenuItem icon={<div>icon</div>} routeLabel="My Label">
        My Content
      </MenuItem>,
    );
    expect(screen.getByText(/icon/i)).toBeInTheDocument();
    expect(screen.getByText(/My Content/i)).toBeInTheDocument();
    expect(
      screen.getByRole(/menuitem/i, { name: /My Label/i }),
    ).toBeInTheDocument();
  });

  test('test isActive prop', () => {
    const { rerender } = render(
      <MenuItem icon={<div>icon</div>} routeLabel="My Label" isActive={false}>
        My Content
      </MenuItem>,
      { grommetOptions: { theme: themeExtend } },
    );

    expect(
      screen.getByRole(/menuitem/i, { name: /My Label/i }),
    ).not.toHaveStyle({
      backgroundColor: normalizeColor('bg-menu-hover', themeExtend),
    });

    rerender(
      <Grommet theme={themeExtend}>
        <MenuItem icon={<div>icon</div>} routeLabel="My Label" isActive={true}>
          My Content
        </MenuItem>
      </Grommet>,
    );

    expect(screen.getByRole(/menuitem/i, { name: /My Label/i })).toHaveStyle({
      backgroundColor: normalizeColor('bg-menu-hover', themeExtend),
    });
  });
});
