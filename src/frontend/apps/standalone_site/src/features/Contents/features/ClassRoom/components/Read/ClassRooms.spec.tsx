import { getDefaultNormalizer, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { ResponsiveContext } from 'grommet';
import { useJwt } from 'lib-components';
import { render } from 'lib-tests';
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
    fetchMock.get('/api/classrooms/?limit=20&offset=0', someStuff);

    render(<ClassRooms />);
    expect(screen.getByRole('alert', { name: /spinner/i })).toBeInTheDocument();
    expect(
      await screen.findByText(/There is no classroom to display./i),
    ).toBeInTheDocument();
  });

  test('render ClassRooms', async () => {
    fetchMock.get('/api/classrooms/?limit=20&offset=0', someResponse);

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
  });

  test('render pagination', async () => {
    fetchMock.get('/api/classrooms/?limit=20&offset=0', {
      ...someResponse,
      count: 111,
    });

    render(<ClassRooms />);

    expect(
      await screen.findByLabelText('Pagination Navigation'),
    ).toBeInTheDocument();
  });

  test('render without pagination', async () => {
    fetchMock.get('/api/classrooms/?limit=20&offset=0', {
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
    fetchMock.get('/api/classrooms/?limit=1&offset=0', {
      ...someResponse,
    });

    render(<ClassRooms withPagination={false} limit={1} />);

    expect(await screen.findByText(/some description/i)).toBeInTheDocument();
    expect(screen.getByText(/some welcome text/i)).toBeInTheDocument();
  });

  test('api limit depend the responsive', async () => {
    fetchMock.get('/api/classrooms/?limit=4&offset=0', {
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
});
