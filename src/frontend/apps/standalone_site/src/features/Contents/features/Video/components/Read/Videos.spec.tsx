import { screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { useJwt, videoMockFactory } from 'lib-components';
import { render } from 'lib-tests';
import { QueryClient } from 'react-query';

import Videos from './Videos';

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

describe('<Videos/>', () => {
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
      '/api/videos/?limit=20&offset=0&ordering=-created_on',
      Promise.reject(new Error('Failed to perform the request')),
    );

    render(<Videos />, {
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

  test('render without videos', async () => {
    const someStuff = {
      count: 0,
      next: null,
      previous: null,
      results: [],
    };
    fetchMock.get(
      '/api/videos/?limit=20&offset=0&ordering=-created_on',
      someStuff,
    );

    render(<Videos />);
    expect(screen.getByRole('alert', { name: /spinner/i })).toBeInTheDocument();
    expect(
      await screen.findByText(/There is no video to display./i),
    ).toBeInTheDocument();
  });

  test('render Videos', async () => {
    fetchMock.get(
      '/api/videos/?limit=20&offset=0&ordering=-created_on',
      someResponse,
    );

    render(<Videos />);
    expect(screen.getByRole('alert', { name: /spinner/i })).toBeInTheDocument();
    expect(await screen.findByText(/New video title/)).toBeInTheDocument();
    expect(screen.getByText(/New video description/)).toBeInTheDocument();
    expect(
      screen.queryByLabelText('Pagination Navigation'),
    ).not.toBeInTheDocument();
  });

  test('render pagination', async () => {
    fetchMock.get('/api/videos/?limit=20&offset=0&ordering=-created_on', {
      ...someResponse,
      count: 111,
    });

    render(<Videos />);

    expect(
      await screen.findByLabelText('Pagination Navigation'),
    ).toBeInTheDocument();
  });

  test('render without pagination', async () => {
    fetchMock.get('/api/videos/?limit=20&offset=0&ordering=-created_on', {
      ...someResponse,
      count: 111,
    });

    render(<Videos withPagination={false} />);

    await waitFor(() => {
      expect(
        screen.queryByLabelText('Pagination Navigation'),
      ).not.toBeInTheDocument();
    });
  });

  test('render with limit', async () => {
    fetchMock.get('/api/videos/?limit=1&offset=0&ordering=-created_on', {
      ...someResponse,
    });

    render(<Videos withPagination={false} limit={1} />);

    expect(await screen.findByText(/New video title/)).toBeInTheDocument();
  });
});
