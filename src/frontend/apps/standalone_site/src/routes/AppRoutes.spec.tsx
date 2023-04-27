import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { render } from 'lib-tests';

import fetchMockAuth from '__mock__/fetchMockAuth.mock';

import AppRoutes from './AppRoutes';

fetchMockAuth();

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

window.scrollTo = jest.fn();

describe('<AppRoutes />', () => {
  beforeEach(() => {
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
  });

  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  test('renders AppRoutes', async () => {
    render(<AppRoutes />);
    expect(
      await screen.findByRole(/menuitem/i, { name: /Dashboard/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/My Header/i)).toBeInTheDocument();
    expect(await screen.findByText(/My HomePage/i)).toBeInTheDocument();
  });

  test('check router', async () => {
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

  test('render invite route', () => {
    render(<AppRoutes />, {
      routerOptions: {
        history: ['/my-contents/classroom/123456/invite/123456'],
      },
    });
    expect(screen.getByText('My HeaderLight')).toBeInTheDocument();
    expect(screen.getByText('My ContentsRouter Page')).toBeInTheDocument();
  });

  test('render generale conditions', async () => {
    render(<AppRoutes />, {
      routerOptions: {
        history: ['/cgi'],
      },
    });
    expect(await screen.findByText('My PagesApi')).toBeInTheDocument();
  });
});
