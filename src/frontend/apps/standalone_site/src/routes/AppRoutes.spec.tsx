import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from 'lib-tests';

import AppRoutes from './AppRoutes';

jest.mock('features/Header', () => {
  const react = jest.requireActual('react');
  const { forwardRef } = react as typeof import('react');
  return {
    Header: forwardRef(() => <div>My Header</div>),
  };
});

jest.mock('features/HomePage', () => ({
  HomePage: () => <div>My HomePage</div>,
}));

jest.mock('features/ClassRoom', () => ({
  ClassRoom: () => <div>My Classrooms</div>,
}));

jest.mock('features/Favorites', () => ({
  Favorites: () => <div>My Favorites</div>,
}));

window.scrollTo = jest.fn();

describe('<AppRoutes />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('renders AppRoutes', async () => {
    render(<AppRoutes />);
    expect(
      screen.getByRole(/menuitem/i, { name: /Dashboard/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/My Header/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/My HomePage/i)).toBeInTheDocument();
    });
  });

  test('check router', async () => {
    render(<AppRoutes />);

    await waitFor(() => {
      expect(screen.getByText(/My HomePage/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole(/menuitem/i, { name: /Favorites/i }));

    await waitFor(() => {
      expect(screen.getByText(/My favorites/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole(/menuitem/i, { name: /Classrooms/i }));

    await waitFor(() => {
      expect(screen.getByText(/My Classrooms/i)).toBeInTheDocument();
    });

    expect(window.scrollTo).toHaveBeenCalledTimes(3);
  });
});
