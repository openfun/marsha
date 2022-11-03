import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

import AppRoutes from './AppRoutes';

describe('<AppRoutes />', () => {
  test('renders AppRoutes', async () => {
    render(<AppRoutes />);
    expect(
      screen.getByRole(/menuitem/i, { name: /Dashboard/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    expect(screen.getByRole(/alert/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Homepage/i)).toBeInTheDocument();
    });
  });

  test('check router', async () => {
    render(<AppRoutes />);

    await waitFor(() => {
      expect(screen.getByText(/Homepage/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole(/menuitem/i, { name: /Favorites/i }));

    await waitFor(() => {
      expect(screen.getByText(/My favorite/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole(/menuitem/i, { name: /Classrooms/i }));

    await waitFor(() => {
      expect(screen.getByText(/Classrooms/i)).toBeInTheDocument();
    });
  });
});
