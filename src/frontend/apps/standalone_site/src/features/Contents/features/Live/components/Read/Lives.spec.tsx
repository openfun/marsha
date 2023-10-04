import { QueryClient } from '@tanstack/react-query';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { ResponsiveContext } from 'grommet';
import { useJwt, videoMockFactory } from 'lib-components';
import { Deferred, render } from 'lib-tests';

import { getFullThemeExtend } from 'styles/theme.extend';

import Lives, { liveContents } from './Lives';

const fullTheme = getFullThemeExtend();

const mockGetDecodedJwt = jest.fn();

const someResponse = {
  count: 1,
  next: null,
  previous: null,
  results: [
    videoMockFactory({
      id: '4321',
      title: 'New webinar title',
      description: 'New webinar description',
      playlist: {
        ...videoMockFactory().playlist,
        title: 'New playlist title',
      },
    }),
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

describe('<Lives/>', () => {
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

  test('render lives with api call error', async () => {
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
      '/api/videos/?limit=20&offset=0&ordering=-created_on&is_live=true&playlist=',
      Promise.reject(new Error('Failed to perform the request')),
    );

    render(<Lives />, {
      queryOptions: {
        client: queryClient,
      },
    });
    expect(screen.getByLabelText('loader')).toBeInTheDocument();

    expect(
      await screen.findByText(/Sorry, an error has occurred./i),
    ).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalled();
  });

  test('render without lives', async () => {
    const someStuff = {
      count: 0,
      next: null,
      previous: null,
      results: [],
    };
    fetchMock.get(
      '/api/videos/?limit=20&offset=0&ordering=-created_on&is_live=true&playlist=',
      someStuff,
    );

    render(<Lives />);
    expect(screen.getByLabelText('loader')).toBeInTheDocument();
    expect(
      await screen.findByText(/There is no webinar to display./i),
    ).toBeInTheDocument();
  });

  test('render Lives', async () => {
    fetchMock.get(
      '/api/videos/?limit=20&offset=0&ordering=-created_on&is_live=true&playlist=',
      someResponse,
    );

    render(<Lives />);
    expect(screen.getByLabelText('loader')).toBeInTheDocument();
    expect(await screen.findByText(/New webinar title/)).toBeInTheDocument();
    expect(screen.getByText(/New webinar description/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Go to next page')).not.toBeInTheDocument();
    expect(screen.getByText('Filter')).toBeInTheDocument();
  });

  test('render pagination', async () => {
    fetchMock.get(
      '/api/videos/?limit=20&offset=0&ordering=-created_on&is_live=true&playlist=',
      {
        ...someResponse,
        count: 111,
      },
    );

    render(<Lives />);

    expect(await screen.findByLabelText('Go to next page')).toBeInTheDocument();
  });

  test('render without pagination', async () => {
    fetchMock.get(
      '/api/videos/?limit=20&offset=0&ordering=-created_on&is_live=true&playlist=',
      {
        ...someResponse,
        count: 111,
      },
    );

    render(<Lives withPagination={false} />);

    await waitFor(() => {
      expect(
        screen.queryByLabelText('Go to next page'),
      ).not.toBeInTheDocument();
    });
  });

  test('render with limit', async () => {
    fetchMock.get(
      '/api/videos/?limit=1&offset=0&ordering=-created_on&is_live=true&playlist=',
      {
        ...someResponse,
      },
    );

    render(<Lives withPagination={false} limit={1} />);

    expect(await screen.findByText(/New webinar title/)).toBeInTheDocument();
  });

  test('api limit depend the responsive', async () => {
    fetchMock.get(
      '/api/videos/?limit=4&offset=0&ordering=-created_on&is_live=true&playlist=',
      {
        ...someResponse,
        count: 111,
      },
    );

    render(
      <ResponsiveContext.Provider value="xxsmall">
        <Lives />
      </ResponsiveContext.Provider>,
      {
        grommetOptions: {
          theme: fullTheme,
        },
      },
    );

    expect(await screen.findByText('New webinar title')).toBeInTheDocument();
  });

  test('filter playlist state on api call', async () => {
    fetchMock.get(
      '/api/videos/?limit=20&offset=0&ordering=-created_on&is_live=true&playlist=',
      {
        ...someResponse,
        count: 111,
      },
    );

    fetchMock.get(
      '/api/videos/?limit=20&offset=0&ordering=-created_on&is_live=true&playlist=an-other-playlist-id',
      {
        ...someResponse,
        count: 111,
      },
    );

    deferredPlaylists.resolve(playlistsResponse);

    render(<Lives />);

    await userEvent.click(
      screen.getByRole('button', {
        name: /Filter/i,
      }),
    );

    await userEvent.click(
      await screen.findByRole('button', {
        name: 'Choose the playlist.',
      }),
    );

    await userEvent.click(
      await screen.findByRole('option', { name: 'an other title' }),
    );

    expect(fetchMock.lastUrl()).toEqual(
      '/api/videos/?limit=20&offset=0&ordering=-created_on&is_live=true&playlist=an-other-playlist-id',
    );
  });

  test('render without filter', async () => {
    fetchMock.get(
      '/api/videos/?limit=20&offset=0&ordering=-created_on&is_live=true&playlist=',
      {
        ...someResponse,
        count: 111,
      },
    );

    render(<Lives withFilter={false} />);

    await waitFor(() => {
      expect(screen.queryByLabelText('Filter')).not.toBeInTheDocument();
    });
  });

  test('api call with playlistId props', () => {
    fetchMock.get(
      '/api/videos/?limit=20&offset=0&ordering=-created_on&is_live=true&playlist=my-playlist-id',
      {
        ...someResponse,
        count: 111,
      },
    );

    render(<Lives playlistId="my-playlist-id" />);

    expect(fetchMock.lastUrl()).toEqual(
      '/api/videos/?limit=20&offset=0&ordering=-created_on&is_live=true&playlist=my-playlist-id',
    );
  });
});

describe('liveContents', () => {
  test('liveContents object', () => {
    expect(liveContents('new-playlist-id')).toEqual({
      title: expect.objectContaining({
        defaultMessage: 'My Webinars',
      }),
      route: '/my-contents/webinars',
      component: (
        <Lives
          limit={4}
          playlistId="new-playlist-id"
          withFilter={false}
          withPagination={false}
        />
      ),
    });
  });
});
