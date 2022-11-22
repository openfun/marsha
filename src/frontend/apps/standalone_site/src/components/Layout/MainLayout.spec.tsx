import { render, screen } from '@testing-library/react';
import { Nullable } from 'lib-common';
import { forwardRef, Fragment } from 'react';

import MainLayout from './MainLayout';

describe('<MainLayout />', () => {
  test('renders MainLayout', () => {
    const HeaderComponent = () => <Fragment>My Header</Fragment>;
    const Header = forwardRef<Nullable<HTMLDivElement>>(HeaderComponent);
    const Menu = () => <Fragment>My menu</Fragment>;
    render(
      <MainLayout Header={Header} menu={<Menu />}>
        Hello World
      </MainLayout>,
    );
    expect(screen.getByText(/My menu/i)).toBeInTheDocument();
    expect(screen.getByText(/Hello World/i)).toBeInTheDocument();
  });
});
