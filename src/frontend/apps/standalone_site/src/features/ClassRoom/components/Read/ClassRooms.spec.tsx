import { getDefaultNormalizer, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import { render } from 'lib-tests';
import { QueryClient } from 'react-query';

import ClassRooms from './ClassRooms';

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

describe('<ClassRooms/>', () => {
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
      '/api/classrooms/?limit=20&offset=0',
      Promise.reject(new Error('Failed to perform the request')),
    );

    render(<ClassRooms />, {
      queryOptions: {
        client: queryClient,
      },
    });
    expect(screen.getByRole('alert', { name: /spinner/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText(/Sorry, an error has occurred./i),
      ).toBeInTheDocument();
    });
    expect(consoleError).toHaveBeenCalled();
  });

  test('render without classRooms', async () => {
    const someStuff = {
      count: 0,
      next: null,
      previous: null,
      results: [],
    };
    fetchMock.get('/api/classrooms/?limit=20&offset=0', someStuff);

    render(<ClassRooms />);
    expect(screen.getByRole('alert', { name: /spinner/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.getByText(/There is no classroom to display./i),
      ).toBeInTheDocument();
    });
  });

  test('render ClassRooms', async () => {
    fetchMock.get('/api/classrooms/?limit=20&offset=0', someResponse);

    render(<ClassRooms />);
    expect(screen.getByRole('alert', { name: /spinner/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/some title/i)).toBeInTheDocument();
    });
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
  });

  test('render pagination', async () => {
    fetchMock.get('/api/classrooms/?limit=20&offset=0', {
      ...someResponse,
      count: 111,
    });

    render(<ClassRooms />);

    await waitFor(() => {
      expect(
        screen.getByLabelText('Pagination Navigation'),
      ).toBeInTheDocument();
    });
  });
});
