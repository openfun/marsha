import { screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { ResponsiveContext } from 'grommet';
import { useJwt, videoMockFactory } from 'lib-components';
import { render } from 'lib-tests';
import { QueryClient } from 'react-query';

import { getFullThemeExtend } from 'styles/theme.extend';

import Lives from './Lives';

const fullTheme = getFullThemeExtend();

const mockGetDecodedJwt = jest.fn();

const someResponse = {
  count: 1,
  next: null,
  previous: null,
  results: [
    videoMockFactory({
      id: '4321',
      title: 'New live title',
      description: 'New live description',
      playlist: {
        ...videoMockFactory().playlist,
        title: 'New playlist title',
      },
    }),
  ],
};

describe('<Lives/>', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'token',
      getDecodedJwt: mockGetDecodedJwt,
    });
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
      '/api/videos/?limit=20&offset=0&ordering=-created_on&is_live=true',
      Promise.reject(new Error('Failed to perform the request')),
    );

    render(<Lives />, {
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

  test('render without lives', async () => {
    const someStuff = {
      count: 0,
      next: null,
      previous: null,
      results: [],
    };
    fetchMock.get(
      '/api/videos/?limit=20&offset=0&ordering=-created_on&is_live=true',
      someStuff,
    );

    render(<Lives />);
    expect(screen.getByRole('alert', { name: /spinner/i })).toBeInTheDocument();
    expect(
      await screen.findByText(/There is no live to display./i),
    ).toBeInTheDocument();
  });

  test('render Lives', async () => {
    fetchMock.get(
      '/api/videos/?limit=20&offset=0&ordering=-created_on&is_live=true',
      someResponse,
    );

    render(<Lives />);
    expect(screen.getByRole('alert', { name: /spinner/i })).toBeInTheDocument();
    expect(await screen.findByText(/New live title/)).toBeInTheDocument();
    expect(screen.getByText(/New live description/)).toBeInTheDocument();
    expect(
      screen.queryByLabelText('Pagination Navigation'),
    ).not.toBeInTheDocument();
  });

  test('render pagination', async () => {
    fetchMock.get(
      '/api/videos/?limit=20&offset=0&ordering=-created_on&is_live=true',
      {
        ...someResponse,
        count: 111,
      },
    );

    render(<Lives />);

    expect(
      await screen.findByLabelText('Pagination Navigation'),
    ).toBeInTheDocument();
  });

  test('render without pagination', async () => {
    fetchMock.get(
      '/api/videos/?limit=20&offset=0&ordering=-created_on&is_live=true',
      {
        ...someResponse,
        count: 111,
      },
    );

    render(<Lives withPagination={false} />);

    await waitFor(() => {
      expect(
        screen.queryByLabelText('Pagination Navigation'),
      ).not.toBeInTheDocument();
    });
  });

  test('render with limit', async () => {
    fetchMock.get(
      '/api/videos/?limit=1&offset=0&ordering=-created_on&is_live=true',
      {
        ...someResponse,
      },
    );

    render(<Lives withPagination={false} limit={1} />);

    expect(await screen.findByText(/New live title/)).toBeInTheDocument();
  });

  test('api limit depend the responsive', async () => {
    fetchMock.get(
      '/api/videos/?limit=4&offset=0&ordering=-created_on&is_live=true',
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

    expect(await screen.findByText('New live title')).toBeInTheDocument();
  });
});
