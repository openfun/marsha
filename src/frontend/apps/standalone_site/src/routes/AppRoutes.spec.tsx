import React from 'react';
import AppRoutes from './AppRoutes';
import { render, screen } from '@testing-library/react';

describe('<AppRoutes />', () => {
  test('renders AppRoutes', () => {
    render(<AppRoutes />);
    expect(screen.getByText(/My first menu/i)).toBeInTheDocument();
    expect(screen.getByText(/My first header/i)).toBeInTheDocument();
    expect(screen.getByText(/HomePage/i)).toBeInTheDocument();
  });
});
