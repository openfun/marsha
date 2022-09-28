import { render, screen } from '@testing-library/react';
import { Fragment } from 'react';
import MainLayout from './MainLayout';

describe('<MainLayout />', () => {
  test('renders MainLayout', () => {
    const Menu = () => <Fragment>My menu</Fragment>;
    render(<MainLayout menu={<Menu />}>Hello World</MainLayout>);
    expect(screen.getByText(/My menu/i)).toBeInTheDocument();
    expect(screen.getByText(/Hello World/i)).toBeInTheDocument();
  });
});
