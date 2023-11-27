import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import {
  useCurrentUser,
  useJwt,
  localStore as useLocalJwt,
} from 'lib-components';
import { render } from 'lib-tests';

import featureContentLoader from 'features/Contents/features/featureLoader';

import AppRoutes from './AppRoutes';

jest.mock('features/Header', () => {
  const react = jest.requireActual('react');
  const { forwardRef } = react as typeof import('react');
  return {
    Header: forwardRef(() => <div>My Header</div>),
    HeaderLight: forwardRef(() => <div>My HeaderLight</div>),
    HeaderLightLink: forwardRef(() => <div>My HeaderLightLink</div>),
  };
});

jest.mock('features/HomePage', () => ({
  HomePage: () => <div>My HomePage</div>,
}));

jest.mock('features/Contents/', () => ({
  ...jest.requireActual('features/Contents/'),
  ContentsRouter: () => <div>My ContentsRouter Page</div>,
  ClassRoomUpdate: () => <div>My ClassRoomUpdate Page</div>,
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

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

window.scrollTo = jest.fn();

featureContentLoader([]);

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
      useLocalJwt.setState({
        setDecodedJwt: (jwt) =>
          useLocalJwt.setState({
            internalDecodedJwt: `${jwt!}-decoded` as any,
          }),
      });

      fetchMock.get('/api/classrooms/456789/token/?invite_token=123456', {
        access_token: 'fake-jwt',
      });

      render(<AppRoutes />, {
        routerOptions: {
          history: ['/my-contents/classroom/456789/invite/123456'],
        },
      });
      expect(await screen.findByText('My HeaderLight')).toBeInTheDocument();
      expect(
        screen.queryByRole('menuitem', { name: /Dashboard/i }),
      ).not.toBeInTheDocument();
      expect(screen.getByText('My ClassRoomUpdate Page')).toBeInTheDocument();
      expect(screen.getByText('My Footer')).toBeInTheDocument();
      expect(useLocalJwt.getState().jwt).toEqual('fake-jwt');
      expect(useLocalJwt.getState().internalDecodedJwt).toEqual(
        'fake-jwt-decoded',
      );
      expect(useJwt.getState().jwt).toBeUndefined();
    });

    test('render invite route error message', async () => {
      fetchMock.get('/api/classrooms/456789/token/?invite_token=123456', {
        status: 400,
        body: {
          code: 'banned_invite_token',
          message:
            'invitation link is not valid anymore. Ask for a new invitation link to the classroom maintainer',
        },
      });

      render(<AppRoutes />, {
        routerOptions: {
          history: ['/my-contents/classroom/456789/invite/123456'],
        },
      });

      expect(await screen.findByText('My HeaderLight')).toBeInTheDocument();
      expect(
        screen.getByText(
          'invitation link is not valid anymore. Ask for a new invitation link to the classroom maintainer',
        ),
      ).toBeInTheDocument();
      expect(screen.getByText('My Footer')).toBeInTheDocument();
      expect(useJwt.getState().jwt).toEqual(undefined);
    });

    test('render generale conditions', async () => {
      render(<AppRoutes />, {
        routerOptions: {
          history: ['/cgi'],
        },
      });
      expect(await screen.findByText('My HeaderLightLink')).toBeInTheDocument();
      expect(await screen.findByText('My PagesApi')).toBeInTheDocument();
      expect(
        screen.queryByRole('menuitem', { name: /Dashboard/i }),
      ).not.toBeInTheDocument();
      expect(screen.getByText('My Footer')).toBeInTheDocument();
    });
  });

  describe('when the user is authenticated', () => {
    test('renders AppRoutes', async () => {
      render(<AppRoutes />, {
        routerOptions: {
          history: ['/'],
        },
      });
      expect(
        await screen.findByRole('menuitem', { name: /Dashboard/i }),
      ).toBeInTheDocument();
      expect(screen.getByText(/My Header/i)).toBeInTheDocument();
      expect(await screen.findByText(/My HomePage/i)).toBeInTheDocument();
      expect(screen.getByText('My Footer')).toBeInTheDocument();
    });

    test('menu interaction with the router', async () => {
      render(<AppRoutes />, {
        routerOptions: {
          history: ['/'],
        },
      });

      expect(await screen.findByText(/My HomePage/i)).toBeInTheDocument();

      await userEvent.click(
        screen.getByRole('menuitem', { name: /My playlists/i }),
      );

      expect(screen.getByText(/My Playlist Page/i)).toBeInTheDocument();

      await userEvent.click(
        screen.getByRole('menuitem', { name: /My Contents/i }),
      );

      expect(screen.getByText(/My ContentsRouter Page/i)).toBeInTheDocument();

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
        screen.getByRole('menuitem', { name: /Dashboard/i }),
      ).toBeInTheDocument();
      expect(screen.getByText('My Footer')).toBeInTheDocument();
    });

    test('render 404', async () => {
      render(<AppRoutes />, {
        routerOptions: {
          history: ['/my-404'],
        },
      });
      expect(
        await screen.findByText(/Sorry, this page does not exist./i),
      ).toBeInTheDocument();
    });
  });
});
