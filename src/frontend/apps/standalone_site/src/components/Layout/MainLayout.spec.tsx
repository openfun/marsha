import { render, screen } from '@testing-library/react';
import React from 'react';
import MainLayout from './MainLayout';

describe('<MainLayout />', () => {
  test('renders MainLayout', () => {
    const Menu = () => <>My menu</>;
    render(<MainLayout menu={<Menu />}>Hello World</MainLayout>);
    expect(screen.getByText(/My menu/i)).toBeInTheDocument();
    expect(screen.getByText(/Hello World/i)).toBeInTheDocument();
  });
});
