import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { PortabilityRequestState } from 'lib-components';
import {
  playlistMockFactory,
  portabilityRequestMockFactory,
} from 'lib-components/tests';
import { Deferred, render } from 'lib-tests';

import { PortabilityRequests } from './PortabilityRequests';

const commonPortabilityObjectsList = [
  portabilityRequestMockFactory({
    created_on: '2021-01-01T00:00:00.000000Z',
    from_playlist: playlistMockFactory({ title: 'playlist FROM 1' }),
    for_playlist: playlistMockFactory({ title: 'playlist FOR 1' }),
    from_lti_consumer_site: { name: 'consumer site 1' } as any,
    from_user: { email: 'from_user@from_user.com' } as any,
    updated_by_user: { email: 'updated_by_user@updated_by_user.com' } as any,
    state: PortabilityRequestState.ACCEPTED,
    can_accept_or_reject: true,
  }),
  portabilityRequestMockFactory({
    created_on: '2022-01-05T00:00:00.000000Z',
    from_playlist: playlistMockFactory({ title: 'playlist FROM 2' }),
    for_playlist: playlistMockFactory({ title: 'playlist FOR 2' }),
    state: PortabilityRequestState.PENDING,
  }),
  portabilityRequestMockFactory({
    created_on: '2023-01-07T00:00:00.000000Z',
    from_playlist: playlistMockFactory({ title: 'playlist FROM 3' }),
    for_playlist: playlistMockFactory({ title: 'playlist FOR 3' }),
    state: PortabilityRequestState.REJECTED,
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
      '/api/portability-requests/?limit=20&offset=0&ordering=-created_on',
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
      '/api/portability-requests/?limit=20&offset=0&ordering=-created_on',
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

    expect(
      await screen.findByRole('columnheader', { name: /Created On/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /Portability Request/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /Consumer Site/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /From user email/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /Updated user email/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /Status/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /Actions/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('1/1/2021 12:00:00 AM')).toBeInTheDocument();
    expect(screen.getByText('consumer site 1')).toBeInTheDocument();
    expect(screen.getByText('from_user@from_user.com')).toBeInTheDocument();
    expect(
      screen.getByText('updated_by_user@updated_by_user.com'),
    ).toBeInTheDocument();
    expect(screen.getByText('Accepted')).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', {
        name: 'Accept',
      }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole('button', {
        name: 'Reject',
      }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText('playlist FROM 1 wants access to playlist FOR 1'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('playlist FROM 2 wants access to playlist FOR 2'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('playlist FROM 3 wants access to playlist FOR 3'),
    ).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });

  it('displays an error', async () => {
    const deferred = new Deferred();
    fetchMock.get(
      '/api/portability-requests/?limit=20&offset=0&ordering=-created_on',
      deferred.promise,
    );

    render(<PortabilityRequests />);

    expect(
      screen.getByRole('heading', { name: 'Portability requests' }),
    ).toBeInTheDocument();

    act(() => deferred.reject());

    await screen.findByText('An error occurred, please try again later.');

    fetchMock.get(
      '/api/portability-requests/?limit=20&offset=0&ordering=-created_on',
      {
        count: 3,
        results: commonPortabilityObjectsList,
      },
      { overwriteRoutes: true },
    );

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(
      screen.getByText('playlist FROM 1 wants access to playlist FOR 1'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('playlist FROM 2 wants access to playlist FOR 2'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('playlist FROM 3 wants access to playlist FOR 3'),
    ).toBeInTheDocument();
  });

  it('allows sorting by create_on', async () => {
    fetchMock.get(
      '/api/portability-requests/?limit=20&offset=0&ordering=-created_on',
      {
        count: 3,
        results: commonPortabilityObjectsList,
      },
    );
    fetchMock.get('/api/portability-requests/?limit=20&offset=0&ordering=', {
      count: 3,
      results: [...commonPortabilityObjectsList].reverse(),
    });
    fetchMock.get(
      '/api/portability-requests/?limit=20&offset=0&ordering=created_on',
      {
        count: 3,
        results: [
          commonPortabilityObjectsList[1],
          commonPortabilityObjectsList[0],
          commonPortabilityObjectsList[2],
        ],
      },
    );

    render(<PortabilityRequests />);

    expect(
      await screen.findByRole('button', { name: /Created On/i }),
    ).toBeInTheDocument();

    expect(
      fetchMock.called(
        '/api/portability-requests/?limit=20&offset=0&ordering=-created_on',
      ),
    ).toBeTruthy();

    const rows__created_on = screen.getAllByRole('row');
    expect(rows__created_on[1]).toHaveTextContent(
      'playlist FROM 1 wants access to playlist FOR 1',
    );
    expect(rows__created_on[2]).toHaveTextContent(
      'playlist FROM 2 wants access to playlist FOR 2',
    );
    expect(rows__created_on[3]).toHaveTextContent(
      'playlist FROM 3 wants access to playlist FOR 3',
    );

    await userEvent.click(screen.getByRole('button', { name: /Created On/i }));
    expect(
      fetchMock.called(
        '/api/portability-requests/?limit=20&offset=0&ordering=',
      ),
    ).toBeTruthy();

    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent(
      'playlist FROM 3 wants access to playlist FOR 3',
    );
    expect(rows[2]).toHaveTextContent(
      'playlist FROM 2 wants access to playlist FOR 2',
    );
    expect(rows[3]).toHaveTextContent(
      'playlist FROM 1 wants access to playlist FOR 1',
    );

    await userEvent.click(screen.getByRole('button', { name: /Created On/i }));
    expect(
      fetchMock.called(
        '/api/portability-requests/?limit=20&offset=0&ordering=created_on',
      ),
    ).toBeTruthy();

    const rows_created_on = screen.getAllByRole('row');
    expect(rows_created_on[1]).toHaveTextContent(
      'playlist FROM 2 wants access to playlist FOR 2',
    );
    expect(rows_created_on[2]).toHaveTextContent(
      'playlist FROM 1 wants access to playlist FOR 1',
    );
    expect(rows_created_on[3]).toHaveTextContent(
      'playlist FROM 3 wants access to playlist FOR 3',
    );
  });

  it('lists only the portability in accepted state', async () => {
    fetchMock.get(
      '/api/portability-requests/?limit=20&offset=0&ordering=-created_on&state=accepted',
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

    expect(
      await screen.findByText('playlist FROM 1 wants access to playlist FOR 1'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('playlist FROM 2 wants access to playlist FOR 2'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('playlist FROM 3 wants access to playlist FOR 3'),
    ).toBeInTheDocument();
  });

  it('lists only the portability in for a playlist', async () => {
    fetchMock.get(
      '/api/portability-requests/?limit=20&offset=0&ordering=-created_on&for_playlist_id=123',
      {
        count: 3,
        results: commonPortabilityObjectsList,
      },
    );

    render(<PortabilityRequests for_playlist_id="123" />);

    expect(
      await screen.findByText('playlist FROM 1 wants access to playlist FOR 1'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('playlist FROM 2 wants access to playlist FOR 2'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('playlist FROM 3 wants access to playlist FOR 3'),
    ).toBeInTheDocument();
  });

  it('displays "Made by LTI user" when no user', async () => {
    const portabilityRequest = portabilityRequestMockFactory({
      from_playlist: playlistMockFactory({ title: 'playlist FROM' }),
      for_playlist: playlistMockFactory({ title: 'playlist FOR' }),
    });

    fetchMock.get(
      '/api/portability-requests/?limit=20&offset=0&ordering=-created_on',
      {
        count: 3,
        results: [portabilityRequest],
      },
    );

    render(<PortabilityRequests />);

    expect(
      await screen.findByText('playlist FROM wants access to playlist FOR'),
    ).toBeInTheDocument();
    expect(screen.getByText('Made by LTI user')).toBeInTheDocument();
  });

  it('displays buttons when allowed', async () => {
    const portabilityRequest = portabilityRequestMockFactory({
      from_playlist: playlistMockFactory({ title: 'playlist FROM' }),
      for_playlist: playlistMockFactory({ title: 'playlist FOR' }),
      can_accept_or_reject: true,
    });

    fetchMock.get(
      '/api/portability-requests/?limit=20&offset=0&ordering=-created_on',
      {
        count: 3,
        results: [portabilityRequest],
      },
    );

    render(<PortabilityRequests />);

    expect(
      await screen.findByText('playlist FROM wants access to playlist FOR'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();
  });

  it('does not display buttons when not allowed', async () => {
    const portabilityRequest = portabilityRequestMockFactory({
      from_playlist: playlistMockFactory({ title: 'playlist FROM' }),
      for_playlist: playlistMockFactory({ title: 'playlist FOR' }),
      can_accept_or_reject: false,
    });

    fetchMock.get(
      '/api/portability-requests/?limit=20&offset=0&ordering=-created_on',
      {
        count: 3,
        results: [portabilityRequest],
      },
    );

    render(<PortabilityRequests />);

    expect(
      await screen.findByText('playlist FROM wants access to playlist FOR'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Accept' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Reject' }),
    ).not.toBeInTheDocument();
  });
});
