import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { useCurrentUser, useJwt } from 'lib-components';
import { render } from 'lib-tests';

import AppRoutes from './AppRoutes';

jest.mock('features/Header', () => {
  const react = jest.requireActual('react');
  const { forwardRef } = react as typeof import('react');
  return {
    Header: forwardRef(() => <div>My Header</div>),
    HeaderLight: forwardRef(() => <div>My HeaderLight</div>),
  };
});

jest.mock('features/HomePage', () => ({
  HomePage: () => <div>My HomePage</div>,
}));

jest.mock('features/Contents/', () => ({
  ContentsRouter: () => <div>My ContentsRouter Page</div>,
}));

jest.mock('features/Playlist', () => ({
  PlaylistRouter: () => <div>My Playlist Page</div>,
}));

jest.mock('features/PagesApi', () => ({
  ...jest.requireActual('features/PagesApi'),
  PagesApi: () => <div>My PagesApi</div>,
}));

jest.mock('features/Footer', () => ({
  Footer: () => <div>My Footer</div>,
}));

jest.mock('features/Authentication', () => ({
  ...jest.requireActual('features/Authentication'),
  AuthRouter: () => <div>My Login</div>,
}));

window.scrollTo = jest.fn();

describe('<AppRoutes />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'fake-jwt',
    });

    fetchMock.get('/api/pages/', {
      results: [
        {
          slug: 'test',
          name: 'Test',
          content: 'My test page',
        },
        {
          slug: 'cgi',
          name: 'General Conditions',
          content: 'Bla bla bla',
        },
      ],
    });

    fetchMock.get('/api/users/whoami/', {
      date_joined: 'date_joined',
      email: 'email',
      full_name: 'full name',
      id: 'id',
      is_staff: false,
      is_superuser: false,
      organization_accesses: [],
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  test('renders meta title desc', async () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'description');
    meta.setAttribute('data-testid', 'description-id');
    document.head.appendChild(meta);

    render(<AppRoutes />);

    await waitFor(() => {
      expect(document.title).toEqual('Marsha');
    });

    expect(within(document.head).getByTestId('description-id')).toHaveAttribute(
      'content',
      'Marsha',
    );
  });

  describe('when the user is not authenticated', () => {
    beforeEach(() => {
      useJwt.setState({
        jwt: undefined,
      });
      useCurrentUser.setState({
        currentUser: undefined,
      });
    });

    test('renders AppRoutes', async () => {
      render(<AppRoutes />);
      expect(await screen.findByText('My Login')).toBeInTheDocument();
    });

    test('render invite route', async () => {
      render(<AppRoutes />, {
        routerOptions: {
          history: ['/my-contents/classroom/123456/invite/123456'],
        },
      });
      expect(await screen.findByText('My HeaderLight')).toBeInTheDocument();
      expect(
        screen.queryByRole(/menuitem/i, { name: /Dashboard/i }),
      ).not.toBeInTheDocument();
      expect(screen.getByText('My ContentsRouter Page')).toBeInTheDocument();
      expect(screen.getByText('My Footer')).toBeInTheDocument();
    });

    test('render generale conditions', async () => {
      render(<AppRoutes />, {
        routerOptions: {
          history: ['/cgi'],
        },
      });
      expect(await screen.findByText('My PagesApi')).toBeInTheDocument();
      expect(
        screen.queryByRole(/menuitem/i, { name: /Dashboard/i }),
      ).not.toBeInTheDocument();
      expect(screen.getByText('My Footer')).toBeInTheDocument();
    });
  });

  describe('when the user is authenticated', () => {
    test('renders AppRoutes', async () => {
      render(<AppRoutes />);
      expect(
        await screen.findByRole(/menuitem/i, { name: /Dashboard/i }),
      ).toBeInTheDocument();
      expect(screen.getByText(/My Header/i)).toBeInTheDocument();
      expect(await screen.findByText(/My HomePage/i)).toBeInTheDocument();
      expect(screen.getByText('My Footer')).toBeInTheDocument();
    });

    test('menu interaction with the router', async () => {
      render(<AppRoutes />);

      expect(await screen.findByText(/My HomePage/i)).toBeInTheDocument();

      userEvent.click(screen.getByRole(/menuitem/i, { name: /My playlists/i }));

      expect(await screen.findByText(/My Playlist Page/i)).toBeInTheDocument();

      userEvent.click(screen.getByRole(/menuitem/i, { name: /Classrooms/i }));

      await waitFor(() => {
        expect(screen.getByText(/My ContentsRouter Page/i)).toBeInTheDocument();
      });

      expect(window.scrollTo).toHaveBeenCalled();
    });

    test('render generale conditions', async () => {
      render(<AppRoutes />, {
        routerOptions: {
          history: ['/cgi'],
        },
      });
      expect(await screen.findByText('My PagesApi')).toBeInTheDocument();
      expect(
        screen.getByRole(/menuitem/i, { name: /Dashboard/i }),
      ).toBeInTheDocument();
      expect(screen.getByText('My Footer')).toBeInTheDocument();
    });
  });
});
