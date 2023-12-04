import { QueryClient } from '@tanstack/react-query';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { ResponsiveContext } from 'grommet';
import { useJwt } from 'lib-components';
import { videoMockFactory } from 'lib-components/tests';
import { Deferred, render } from 'lib-tests';

import { getFullThemeExtend } from 'styles/theme.extend';

import Videos, { videoContents } from './Videos';

const fullTheme = getFullThemeExtend();

const mockGetDecodedJwt = jest.fn();

const someResponse = {
  count: 1,
  next: null,
  previous: null,
  results: [
    videoMockFactory({
      id: '4321',
      title: 'New video title',
      description: 'New video description',
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

describe('<Videos/>', () => {
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

  test('render Videos with api call error', async () => {
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
      '/api/videos/?limit=20&offset=0&ordering=-created_on&is_live=false&playlist=',
      Promise.reject(new Error('Failed to perform the request')),
    );

    render(<Videos />, {
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

  test('render without videos', async () => {
    const someStuff = {
      count: 0,
      next: null,
      previous: null,
      results: [],
    };
    fetchMock.get(
      '/api/videos/?limit=20&offset=0&ordering=-created_on&is_live=false&playlist=',
      someStuff,
    );

    render(<Videos />);
    expect(screen.getByLabelText('loader')).toBeInTheDocument();
    expect(
      await screen.findByText(/There is no video to display./i),
    ).toBeInTheDocument();
  });

  test('render Videos', async () => {
    fetchMock.get(
      '/api/videos/?limit=20&offset=0&ordering=-created_on&is_live=false&playlist=',
      someResponse,
    );

    render(<Videos />);
    expect(screen.getByLabelText('loader')).toBeInTheDocument();
    expect(await screen.findByText(/New video title/)).toBeInTheDocument();
    expect(screen.getByText(/New video description/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Go to next page')).not.toBeInTheDocument();
    expect(screen.getByText('Filter')).toBeInTheDocument();
  });

  test('render pagination', async () => {
    fetchMock.get(
      '/api/videos/?limit=20&offset=0&ordering=-created_on&is_live=false&playlist=',
      {
        ...someResponse,
        count: 111,
      },
    );

    render(<Videos />);

    expect(await screen.findByLabelText('Go to next page')).toBeInTheDocument();
  });

  test('render without pagination', async () => {
    fetchMock.get(
      '/api/videos/?limit=20&offset=0&ordering=-created_on&is_live=false&playlist=',
      {
        ...someResponse,
        count: 111,
      },
    );

    render(<Videos withPagination={false} />);

    await waitFor(() => {
      expect(
        screen.queryByLabelText('Go to next page'),
      ).not.toBeInTheDocument();
    });
  });

  test('render with limit', async () => {
    fetchMock.get(
      '/api/videos/?limit=1&offset=0&ordering=-created_on&is_live=false&playlist=',
      {
        ...someResponse,
      },
    );

    render(<Videos withPagination={false} limit={1} />);

    expect(await screen.findByText(/New video title/)).toBeInTheDocument();
  });

  test('api limit depend the responsive', async () => {
    fetchMock.get(
      '/api/videos/?limit=4&offset=0&ordering=-created_on&is_live=false&playlist=',
      {
        ...someResponse,
        count: 111,
      },
    );

    render(
      <ResponsiveContext.Provider value="xxsmall">
        <Videos />
      </ResponsiveContext.Provider>,
      {
        grommetOptions: {
          theme: fullTheme,
        },
      },
    );

    expect(await screen.findByText('New video title')).toBeInTheDocument();
  });

  test('filter playlist state on api call', async () => {
    fetchMock.get(
      '/api/videos/?limit=20&offset=0&ordering=-created_on&is_live=false&playlist=',
      {
        ...someResponse,
        count: 111,
      },
    );
    fetchMock.get(
      '/api/videos/?limit=20&offset=0&ordering=-created_on&is_live=false&playlist=an-other-playlist-id',
      {
        ...someResponse,
        count: 111,
      },
    );

    deferredPlaylists.resolve(playlistsResponse);

    render(<Videos />);

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
      '/api/videos/?limit=20&offset=0&ordering=-created_on&is_live=false&playlist=an-other-playlist-id',
    );
  });

  test('render without filter', async () => {
    fetchMock.get(
      '/api/videos/?limit=20&offset=0&ordering=-created_on&is_live=false&playlist=',
      {
        ...someResponse,
        count: 111,
      },
    );

    render(<Videos withFilter={false} />);

    await waitFor(() => {
      expect(screen.queryByLabelText('Filter')).not.toBeInTheDocument();
    });
  });

  test('api call with playlistId props', () => {
    fetchMock.get(
      '/api/videos/?limit=20&offset=0&ordering=-created_on&is_live=false&playlist=my-playlist-id',
      {
        ...someResponse,
        count: 111,
      },
    );

    render(<Videos playlistId="my-playlist-id" />);

    expect(fetchMock.lastUrl()).toEqual(
      '/api/videos/?limit=20&offset=0&ordering=-created_on&is_live=false&playlist=my-playlist-id',
    );
  });
});

describe('videoContents', () => {
  test('videoContents object', () => {
    expect(videoContents('new-playlist-id')).toEqual({
      title: expect.objectContaining({
        defaultMessage: 'My Videos',
      }),
      route: '/my-contents/videos',
      component: (
        <Videos
          limit={4}
          playlistId="new-playlist-id"
          withFilter={false}
          withPagination={false}
        />
      ),
    });
  });
});
