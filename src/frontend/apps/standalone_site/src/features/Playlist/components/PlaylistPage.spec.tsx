import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { Deferred, render } from 'lib-tests';

import { PlaylistPage } from './PlaylistPage';

describe('<PlaylistPage />', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    fetchMock.restore();
  });

  it('loads content and display creation message', async () => {
    const deferred = new Deferred();
    fetchMock.get(
      '/api/playlists/?limit=20&offset=0&ordering=-created_on',
      deferred.promise,
    );

    render(<PlaylistPage />);

    expect(
      screen.getByRole('heading', { name: 'My Playlists' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();

    act(() => deferred.resolve({ count: 0, results: [] }));

    await screen.findByText('You have no playlist yet.');
    expect(
      screen.getByRole('button', { name: 'Create playlist' }),
    ).toBeInTheDocument();
  });

  it('loads content and display table', async () => {
    const deferred = new Deferred();
    fetchMock.get(
      '/api/playlists/?limit=20&offset=0&ordering=-created_on',
      deferred.promise,
    );

    render(<PlaylistPage />);

    expect(
      screen.getByRole('heading', { name: 'My Playlists' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();

    act(() =>
      deferred.resolve({
        count: 3,
        results: [
          {
            title: 'playlist 1',
            lti_id: 'id-1',
            consumer_site: 'some.consumer',
            created_on: '2023-05-22T14:50:50.400986Z',
            organization: {
              id: 'id-org',
              name: 'org',
            },
          },
          {
            title: 'playlist 2',
            lti_id: 'id-2',
            consumer_site: 'some.consumer',
            created_on: '2023-05-24T14:50:50.400986Z',
            organization: {
              id: 'id-org2',
              name: 'org 2',
            },
          },
          {
            title: 'playlist 3',
            lti_id: 'id-3',
            consumer_site: 'an.other.consumer',
            created_on: '2023-05-26T14:50:50.400986Z',
            organization: undefined,
          },
        ],
      }),
    );

    expect(await screen.findByText('playlist 1')).toBeInTheDocument();
    expect(screen.getByText('playlist 2')).toBeInTheDocument();
    expect(screen.getByText('playlist 3')).toBeInTheDocument();
    expect(screen.getByText('5/22/2023 2:50:50 PM')).toBeInTheDocument();
    expect(screen.getByText('5/24/2023 2:50:50 PM')).toBeInTheDocument();
    expect(screen.getByText('5/26/2023 2:50:50 PM')).toBeInTheDocument();
    expect(screen.getByText('org')).toBeInTheDocument();
    expect(screen.getByText('org 2')).toBeInTheDocument();
    expect(screen.getByText(/Organization/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Create playlist' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Title/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Created On/i }),
    ).toBeInTheDocument();
  });

  it('display the date according to the navigator language', async () => {
    const deferred = new Deferred();
    fetchMock.get(
      '/api/playlists/?limit=20&offset=0&ordering=-created_on',
      deferred.promise,
    );

    const languageGetter = jest.spyOn(window.navigator, 'language', 'get');
    languageGetter.mockReturnValue('fr');

    render(<PlaylistPage />);

    act(() =>
      deferred.resolve({
        count: 3,
        results: [
          {
            title: 'playlist 1',
            lti_id: 'id-1',
            consumer_site: 'some.consumer',
            created_on: '2023-05-22T14:50:50.400986Z',
            organization: {
              id: 'id-org',
              name: 'org',
            },
          },
          {
            title: 'playlist 2',
            lti_id: 'id-2',
            consumer_site: 'some.consumer',
            created_on: '2023-05-24T14:50:50.400986Z',
            organization: {
              id: 'id-org2',
              name: 'org 2',
            },
          },
          {
            title: 'playlist 3',
            lti_id: 'id-3',
            consumer_site: 'an.other.consumer',
            created_on: '2023-05-26T14:50:50.400986Z',
            organization: undefined,
          },
        ],
      }),
    );

    expect(await screen.findByText('22/05/2023 14:50:50')).toBeInTheDocument();
    expect(screen.getByText('24/05/2023 14:50:50')).toBeInTheDocument();
    expect(screen.getByText('26/05/2023 14:50:50')).toBeInTheDocument();
  });

  it('displays an error', async () => {
    const deferred = new Deferred();
    fetchMock.get(
      '/api/playlists/?limit=20&offset=0&ordering=-created_on',
      deferred.promise,
    );

    render(<PlaylistPage />);

    expect(
      screen.getByRole('heading', { name: 'My Playlists' }),
    ).toBeInTheDocument();

    act(() => deferred.reject());

    await screen.findByText('An error occurred, please try again later.');

    fetchMock.get(
      '/api/playlists/?limit=20&offset=0&ordering=-created_on',
      {
        count: 3,
        results: [
          {
            title: 'playlist 1',
            lti_id: 'id-1',
            consumer_site: 'some.consumer',
          },
          {
            title: 'playlist 2',
            lti_id: 'id-2',
            consumer_site: 'some.consumer',
          },
          {
            title: 'playlist 3',
            lti_id: 'id-3',
            consumer_site: 'an.other.consumer',
          },
        ],
      },
      { overwriteRoutes: true },
    );
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    screen.getByText('playlist 1');
    screen.getByText('playlist 2');
    screen.getByText('playlist 3');

    screen.getByRole('button', { name: 'Create playlist' });
  });

  it('checks sorting interactions', async () => {
    const results = [
      {
        title: 'playlist 1',
        lti_id: 'id-1',
        consumer_site: 'some.consumer',
        created_on: '2023-05-26T14:50:50.400986Z',
      },
      {
        title: 'playlist 2',
        lti_id: 'id-2',
        consumer_site: 'some.consumer',
        created_on: '2023-05-25T14:50:50.400986Z',
      },
      {
        title: 'playlist 3',
        lti_id: 'id-3',
        consumer_site: 'an.other.consumer',
        created_on: '2023-05-24T14:50:50.400986Z',
      },
    ];

    fetchMock.get('/api/playlists/?limit=20&offset=0&ordering=-created_on', {
      count: 3,
      results,
    });

    fetchMock.get('/api/playlists/?limit=20&offset=0', {
      count: 3,
      results: [...results].reverse(),
    });

    fetchMock.get('/api/playlists/?limit=20&offset=0&ordering=created_on', {
      count: 3,
      results,
    });

    fetchMock.get('/api/playlists/?limit=20&offset=0&ordering=title', {
      count: 3,
      results: [...results].reverse(),
    });

    fetchMock.get('/api/playlists/?limit=20&offset=0&ordering=-title', {
      count: 3,
      results,
    });

    render(<PlaylistPage />);

    expect(await screen.findByText('playlist 1')).toBeInTheDocument();

    expect(
      fetchMock.called(
        '/api/playlists/?limit=20&offset=0&ordering=-created_on',
      ),
    ).toBeTruthy();

    const rows__created_on = screen.getAllByRole('row');
    expect(rows__created_on[1]).toHaveTextContent('playlist 1');
    expect(rows__created_on[2]).toHaveTextContent('playlist 2');
    expect(rows__created_on[3]).toHaveTextContent('playlist 3');

    await userEvent.click(screen.getByRole('button', { name: /Created On/i }));
    expect(fetchMock.called('/api/playlists/?limit=20&offset=0')).toBeTruthy();

    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('playlist 3');
    expect(rows[2]).toHaveTextContent('playlist 2');
    expect(rows[3]).toHaveTextContent('playlist 1');

    await userEvent.click(screen.getByRole('button', { name: /Created On/i }));
    expect(
      fetchMock.called('/api/playlists/?limit=20&offset=0&ordering=created_on'),
    ).toBeTruthy();

    const rows_created_on = screen.getAllByRole('row');
    expect(rows_created_on[1]).toHaveTextContent('playlist 1');
    expect(rows_created_on[2]).toHaveTextContent('playlist 2');
    expect(rows_created_on[3]).toHaveTextContent('playlist 3');

    await userEvent.click(screen.getByRole('button', { name: /Title/i }));
    expect(
      fetchMock.called('/api/playlists/?limit=20&offset=0&ordering=title'),
    ).toBeTruthy();

    const rows_title = screen.getAllByRole('row');
    expect(rows_title[1]).toHaveTextContent('playlist 3');
    expect(rows_title[2]).toHaveTextContent('playlist 2');
    expect(rows_title[3]).toHaveTextContent('playlist 1');

    await userEvent.click(screen.getByRole('button', { name: /Title/i }));
    expect(
      fetchMock.called('/api/playlists/?limit=20&offset=0&ordering=-title'),
    ).toBeTruthy();

    const rows__title = screen.getAllByRole('row');
    expect(rows__title[1]).toHaveTextContent('playlist 1');
    expect(rows__title[2]).toHaveTextContent('playlist 2');
    expect(rows__title[3]).toHaveTextContent('playlist 3');
  });

  it('opens the create playlist form', async () => {
    fetchMock.get('/api/playlists/?limit=20&offset=0&ordering=-created_on', {
      count: 0,
      results: [],
    });
    fetchMock.get('/api/organizations/?limit=20&offset=0', {
      count: 1,
      results: [
        {
          id: 'id',
          name: 'org',
          created_on: 'some days',
          users: [],
          consumer_sites: ['consumer site 1'],
        },
      ],
      next: 'next',
      previous: 'previous',
    });

    render(<PlaylistPage />);

    await screen.findByText('You have no playlist yet.');

    await userEvent.click(
      screen.getByRole('button', { name: 'Create playlist' }),
    );

    expect(await screen.findByText('Create a playlist')).toBeInTheDocument();
  });
});
