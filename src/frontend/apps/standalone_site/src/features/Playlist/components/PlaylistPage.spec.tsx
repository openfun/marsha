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
      }),
    );

    await screen.findByText('playlist 1');
    screen.getByText('playlist 2');
    screen.getByText('playlist 3');

    screen.getByRole('button', { name: 'Create playlist' });
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
    userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await screen.findByText('playlist 1');
    screen.getByText('playlist 2');
    screen.getByText('playlist 3');

    screen.getByRole('button', { name: 'Create playlist' });
  });

  it('allows sorting by create_on and by title', async () => {
    fetchMock.get('/api/playlists/?limit=20&offset=0&ordering=-created_on', {
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
    });

    render(<PlaylistPage />);

    await screen.findByText('playlist 1');
    userEvent.click(
      screen.getByRole('button', { name: 'Sort item in the table' }),
    );

    await screen.findByText('Title');
    expect(screen.getByText('Creation date')).toBeInTheDocument();
    expect(screen.getAllByText('Creation date (reversed)').length).toEqual(2);
    expect(screen.getByText('Title (reversed)')).toBeInTheDocument();
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

    userEvent.click(screen.getByRole('button', { name: 'Create playlist' }));

    expect(await screen.findByText('Create a playlist')).toBeInTheDocument();
  });
});
