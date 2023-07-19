import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import {
  PortabilityRequest,
  playlistMockFactory,
  portabilityRequestMockFactory,
} from 'lib-components';
import { Deferred, render } from 'lib-tests';
import { setLogger } from '@tanstack/react-query';

import { PortabilityRequests } from './PortabilityRequests';

jest.mock('./ItemTableRow', () => ({
  __esModule: true,
  ItemTableRow: ({ item }: { item: PortabilityRequest }) => (
    <div>{`${item.from_playlist.title!} -> ${item.for_playlist.title!}`}</div>
  ),
}));

const commonPortabilityObjectsList = [
  portabilityRequestMockFactory({
    from_playlist: playlistMockFactory({ title: 'playlist FROM 1' }),
    for_playlist: playlistMockFactory({ title: 'playlist FOR 1' }),
  }),
  portabilityRequestMockFactory({
    from_playlist: playlistMockFactory({ title: 'playlist FROM 2' }),
    for_playlist: playlistMockFactory({ title: 'playlist FOR 2' }),
  }),
  portabilityRequestMockFactory({
    from_playlist: playlistMockFactory({ title: 'playlist FROM 3' }),
    for_playlist: playlistMockFactory({ title: 'playlist FOR 3' }),
  }),
];

describe('<PortabilityRequests />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('loads content when not portability request', async () => {
    const deferred = new Deferred();
    fetchMock.get(
      '/api/portability-requests/?limit=20&offset=0&ordering=-created_on&state=&for_playlist_id=',
      deferred.promise,
    );

    render(<PortabilityRequests />);

    expect(
      screen.getByRole('heading', { name: 'Portability requests' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();

    act(() => deferred.resolve({ count: 0, results: [] }));

    await screen.findByText('You have no portability request yet.');
  });

  it('loads content and display table', async () => {
    const deferred = new Deferred();
    fetchMock.get(
      '/api/portability-requests/?limit=20&offset=0&ordering=-created_on&state=&for_playlist_id=',
      deferred.promise,
    );

    render(<PortabilityRequests />);

    expect(
      screen.getByRole('heading', { name: 'Portability requests' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();

    act(() =>
      deferred.resolve({
        count: 3,
        results: commonPortabilityObjectsList,
      }),
    );

    await screen.findByText('playlist FROM 1 -> playlist FOR 1');
    screen.getByText('playlist FROM 2 -> playlist FOR 2');
    screen.getByText('playlist FROM 3 -> playlist FOR 3');
  });

  it('displays an error', async () => {
    setLogger({
      log: console.log,
      warn: console.warn,
      // disable the "invalid json response body" error when testing failure
      error: jest.fn(),
    });

    const deferred = new Deferred();
    fetchMock.get(
      '/api/portability-requests/?limit=20&offset=0&ordering=-created_on&state=&for_playlist_id=',
      deferred.promise,
    );

    render(<PortabilityRequests />);

    expect(
      screen.getByRole('heading', { name: 'Portability requests' }),
    ).toBeInTheDocument();

    act(() => deferred.reject());

    await screen.findByText('An error occurred, please try again later.');

    fetchMock.get(
      '/api/portability-requests/?limit=20&offset=0&ordering=-created_on&state=&for_playlist_id=',
      {
        count: 3,
        results: commonPortabilityObjectsList,
      },
      { overwriteRoutes: true },
    );
    userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await screen.findByText('playlist FROM 1 -> playlist FOR 1');
    screen.getByText('playlist FROM 2 -> playlist FOR 2');
    screen.getByText('playlist FROM 3 -> playlist FOR 3');
  });

  it('allows sorting by create_on and by title', async () => {
    fetchMock.get(
      '/api/portability-requests/?limit=20&offset=0&ordering=-created_on&state=&for_playlist_id=',
      {
        count: 3,
        results: commonPortabilityObjectsList,
      },
    );

    render(<PortabilityRequests />);

    await screen.findByText('playlist FROM 1 -> playlist FOR 1');
    userEvent.click(
      screen.getByRole('button', { name: 'Sort item in the table' }),
    );

    await screen.findByText('Creation date');
    expect(screen.getAllByText('Creation date (reversed)').length).toEqual(2);
  });

  it('lists only the portability in accepted state', async () => {
    fetchMock.get(
      '/api/portability-requests/?limit=20&offset=0&ordering=-created_on&state=accepted&for_playlist_id=',
      {
        count: 3,
        results: [
          { ...commonPortabilityObjectsList[0], state: 'accepted' },
          { ...commonPortabilityObjectsList[1], state: 'accepted' },
          { ...commonPortabilityObjectsList[2], state: 'accepted' },
        ],
      },
    );

    render(<PortabilityRequests state="accepted" />);

    await screen.findByText('playlist FROM 1 -> playlist FOR 1');
    expect(
      screen.getByText('playlist FROM 2 -> playlist FOR 2'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('playlist FROM 3 -> playlist FOR 3'),
    ).toBeInTheDocument();
  });

  it('lists only the portability in for a playlist', async () => {
    fetchMock.get(
      '/api/portability-requests/?limit=20&offset=0&ordering=-created_on&state=&for_playlist_id=123',
      {
        count: 3,
        results: commonPortabilityObjectsList,
      },
    );

    render(<PortabilityRequests for_playlist_id="123" />);

    await screen.findByText('playlist FROM 1 -> playlist FOR 1');
    expect(
      screen.getByText('playlist FROM 2 -> playlist FOR 2'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('playlist FROM 3 -> playlist FOR 3'),
    ).toBeInTheDocument();
  });
});
