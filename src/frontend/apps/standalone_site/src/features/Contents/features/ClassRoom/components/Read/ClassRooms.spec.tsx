import { getDefaultNormalizer, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { ResponsiveContext } from 'grommet';
import { useJwt } from 'lib-components';
import { Deferred, render } from 'lib-tests';
import { QueryClient } from 'react-query';

import { getFullThemeExtend } from 'styles/theme.extend';

import ClassRooms from './ClassRooms';

const fullTheme = getFullThemeExtend();

const mockGetDecodedJwt = jest.fn();

const someResponse = {
  count: 1,
  next: null,
  previous: null,
  results: [
    {
      id: '1234',
      title: 'some title',
      description: 'some description',
      welcome_text: 'some welcome text',
      ended: true,
      starting_at: '2022-10-18T11:00:00Z',
      estimated_duration: '01:23:00',
    },
  ],
};

const playlistsResponse = {
  count: 2,
  next: null,
  previous: null,
  results: [
    { id: 'some-playlist-id', title: 'some playlist title' },
    { id: 'an-other-playlist-id', title: 'an other title' },
  ],
};

const deferredPlaylists = new Deferred();

describe('<ClassRooms/>', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'token',
      getDecodedJwt: mockGetDecodedJwt,
    });

    fetchMock.get(
      '/api/playlists/?limit=20&offset=0&ordering=-created_on&can_edit=true',
      deferredPlaylists.promise,
    );
  });
  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  test('render with classRooms api call error', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => jest.fn());

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    fetchMock.get(
      '/api/classrooms/?limit=20&offset=0&playlist=',
      Promise.reject(new Error('Failed to perform the request')),
    );

    render(<ClassRooms />, {
      queryOptions: {
        client: queryClient,
      },
    });
    expect(screen.getByRole('alert', { name: /spinner/i })).toBeInTheDocument();

    expect(
      await screen.findByText(/Sorry, an error has occurred./i),
    ).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalled();
  });

  test('render without classRooms', async () => {
    const someStuff = {
      count: 0,
      next: null,
      previous: null,
      results: [],
    };
    fetchMock.get('/api/classrooms/?limit=20&offset=0&playlist=', someStuff);

    render(<ClassRooms />);
    expect(screen.getByRole('alert', { name: /spinner/i })).toBeInTheDocument();
    expect(
      await screen.findByText(/There is no classroom to display./i),
    ).toBeInTheDocument();
  });

  test('render ClassRooms', async () => {
    fetchMock.get('/api/classrooms/?limit=20&offset=0&playlist=', someResponse);

    render(<ClassRooms />);
    expect(screen.getByRole('alert', { name: /spinner/i })).toBeInTheDocument();
    expect(await screen.findByText(/some title/i)).toBeInTheDocument();
    expect(screen.getByText(/some description/i)).toBeInTheDocument();
    expect(screen.getByText(/some welcome text/i)).toBeInTheDocument();
    expect(
      screen.getByText('10/18/2022  ·  11:00:00 AM', {
        normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('01:23:00')).toBeInTheDocument();
    expect(
      screen.queryByLabelText('Pagination Navigation'),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Filter')).toBeInTheDocument();
  });

  test('render pagination', async () => {
    fetchMock.get('/api/classrooms/?limit=20&offset=0&playlist=', {
      ...someResponse,
      count: 111,
    });

    render(<ClassRooms />);

    expect(
      await screen.findByLabelText('Pagination Navigation'),
    ).toBeInTheDocument();
  });

  test('render without pagination', async () => {
    fetchMock.get('/api/classrooms/?limit=20&offset=0&playlist=', {
      ...someResponse,
      count: 111,
    });

    render(<ClassRooms withPagination={false} />);

    await waitFor(() => {
      expect(
        screen.queryByLabelText('Pagination Navigation'),
      ).not.toBeInTheDocument();
    });
  });

  test('render with limit', async () => {
    fetchMock.get('/api/classrooms/?limit=1&offset=0&playlist=', {
      ...someResponse,
    });

    render(<ClassRooms withPagination={false} limit={1} />);

    expect(await screen.findByText(/some description/i)).toBeInTheDocument();
    expect(screen.getByText(/some welcome text/i)).toBeInTheDocument();
  });

  test('api limit depend the responsive', async () => {
    fetchMock.get('/api/classrooms/?limit=4&offset=0&playlist=', {
      ...someResponse,
      count: 111,
    });

    render(
      <ResponsiveContext.Provider value="xxsmall">
        <ClassRooms />
      </ResponsiveContext.Provider>,
      {
        grommetOptions: {
          theme: fullTheme,
        },
      },
    );

    expect(await screen.findByText('some welcome text')).toBeInTheDocument();
  });

  test('filter playlist state on api call', async () => {
    fetchMock.get('/api/classrooms/?limit=20&offset=0&playlist=', {
      ...someResponse,
      count: 111,
    });

    fetchMock.get(
      '/api/classrooms/?limit=20&offset=0&playlist=an-other-playlist-id',
      {
        ...someResponse,
        count: 111,
      },
    );

    deferredPlaylists.resolve(playlistsResponse);

    render(<ClassRooms />);

    screen
      .getByRole('button', {
        name: /Filter/i,
      })
      .click();

    userEvent.click(
      await screen.findByRole('button', {
        name: 'Choose the playlist.',
      }),
    );

    userEvent.click(
      await screen.findByRole('option', { name: 'an other title' }),
    );

    expect(fetchMock.lastUrl()).toEqual(
      '/api/classrooms/?limit=20&offset=0&playlist=an-other-playlist-id',
    );
  });

  test('render without filter', async () => {
    fetchMock.get('/api/classrooms/?limit=20&offset=0&playlist=', {
      ...someResponse,
      count: 111,
    });

    render(<ClassRooms withFilter={false} />);

    await waitFor(() => {
      expect(screen.queryByLabelText('Filter')).not.toBeInTheDocument();
    });
  });

  test('api call with playlistId props', () => {
    fetchMock.get(
      '/api/classrooms/?limit=20&offset=0&playlist=my-playlist-id',
      {
        ...someResponse,
        count: 111,
      },
    );

    render(<ClassRooms playlistId="my-playlist-id" />);

    expect(fetchMock.lastUrl()).toEqual(
      '/api/classrooms/?limit=20&offset=0&playlist=my-playlist-id',
    );
  });
});
