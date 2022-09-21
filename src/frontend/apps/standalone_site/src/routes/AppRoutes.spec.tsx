import { render, screen } from '@testing-library/react';
import React from 'react';
import AppRoutes from './AppRoutes';

describe('<AppRoutes />', () => {
  test('renders AppRoutes', () => {
    render(<AppRoutes />);
    expect(
      screen.getByRole(/menuitem/i, { name: /Dashboard/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/My first header/i)).toBeInTheDocument();
    expect(screen.getByText(/HomePage/i)).toBeInTheDocument();
  });
});
