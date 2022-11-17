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
  ClassRoom: () => <div>My Classrooms Page</div>,
}));

jest.mock('features/Playlist', () => ({
  PlaylistPage: () => <div>My Playlist Page</div>,
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

    fireEvent.click(screen.getByRole(/menuitem/i, { name: /My playlists/i }));

    await waitFor(() => {
      expect(screen.getByText(/My Playlist Page/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole(/menuitem/i, { name: /Classrooms/i }));

    await waitFor(() => {
      expect(screen.getByText(/My Classrooms Page/i)).toBeInTheDocument();
    });

    expect(window.scrollTo).toHaveBeenCalledTimes(3);
  });
});
