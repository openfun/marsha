import { render, screen } from '@testing-library/react';
import { Nullable } from 'lib-common';
import { Fragment, forwardRef } from 'react';

import MainLayout from './MainLayout';

const HeaderComponent = () => <Fragment>My Header</Fragment>;
const Header = forwardRef<Nullable<HTMLDivElement>>(HeaderComponent);
const Menu = () => <Fragment>My menu</Fragment>;
const Footer = () => <Fragment>My footer</Fragment>;

describe('<MainLayout />', () => {
  test('renders MainLayout', () => {
    render(
      <MainLayout Header={Header} menu={<Menu />} footer={<Footer />}>
        Hello World
      </MainLayout>,
    );
    expect(screen.getByText(/My menu/i)).toBeInTheDocument();
    expect(screen.getByText(/Hello World/i)).toBeInTheDocument();
    expect(screen.getByText(/My Header/i)).toBeInTheDocument();
    expect(screen.getByText(/My footer/i)).toBeInTheDocument();
  });
});
