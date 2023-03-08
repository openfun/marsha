import { act, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import {
  consumerSiteMockFactory,
  playlistMockFactory,
  portabilityRequestMockFactory,
  useJwt,
  userMockFactory,
} from 'lib-components';
import { Deferred, render } from 'lib-tests';
import { setLogger } from 'react-query';

import { ItemTableRow } from './ItemTableRow';

describe('<ItemTableRow />', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  it('renders portability request', () => {
    const portabilityRequest = portabilityRequestMockFactory({
      from_playlist: playlistMockFactory({ title: 'playlist FROM' }),
      for_playlist: playlistMockFactory({ title: 'playlist FOR' }),
      from_lti_consumer_site: consumerSiteMockFactory({
        name: 'consumer site name',
      }),
      from_user: userMockFactory({ email: 'tony@example.org' }),
      updated_by_user: userMockFactory({ email: 'updator@example.org' }),
      can_accept_or_reject: true,
    });

    render(<ItemTableRow item={portabilityRequest} />);

    expect(
      screen.getByText('playlist FROM wants access to playlist FOR'),
    ).toBeInTheDocument();
    expect(screen.getByText('consumer site name')).toBeInTheDocument();
    expect(screen.getByText('tony@example.org')).toBeInTheDocument();
    expect(screen.getByText('updator@example.org')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();
  });

  it('displays "Made by LTI user" when no user', () => {
    const portabilityRequest = portabilityRequestMockFactory({
      from_playlist: playlistMockFactory({ title: 'playlist FROM' }),
      for_playlist: playlistMockFactory({ title: 'playlist FOR' }),
      can_accept_or_reject: true,
    });

    render(<ItemTableRow item={portabilityRequest} />);

    expect(
      screen.getByText('playlist FROM wants access to playlist FOR'),
    ).toBeInTheDocument();
    expect(screen.getByText('Made by LTI user')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();
  });

  it('does not display buttons when not allowed', () => {
    const portabilityRequest = portabilityRequestMockFactory({
      from_playlist: playlistMockFactory({ title: 'playlist FROM' }),
      for_playlist: playlistMockFactory({ title: 'playlist FOR' }),
      can_accept_or_reject: false,
    });

    render(<ItemTableRow item={portabilityRequest} />);

    expect(
      screen.getByText('playlist FROM wants access to playlist FOR'),
    ).toBeInTheDocument();
    expect(screen.getByText('Made by LTI user')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Accept' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Reject' }),
    ).not.toBeInTheDocument();
  });

  it('accepts portability request', async () => {
    const portabilityRequest = portabilityRequestMockFactory({
      from_playlist: playlistMockFactory({ title: 'playlist FROM' }),
      for_playlist: playlistMockFactory({ title: 'playlist FOR' }),
      can_accept_or_reject: true,
    });

    const { rerender } = render(<ItemTableRow item={portabilityRequest} />);

    const deferred = new Deferred();
    fetchMock.postOnce(
      `/api/portability-requests/${portabilityRequest.id}/accept/`,
      deferred.promise,
    );

    expect(
      screen.getByText('playlist FROM wants access to playlist FOR'),
    ).toBeInTheDocument();

    act(() => screen.getByRole('button', { name: 'Accept' }).click());

    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument(); // spinner
    });

    expect(
      screen.queryByRole('button', { name: 'Accept' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Reject' }),
    ).not.toBeInTheDocument();

    act(() => deferred.resolve('null'));

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument(); // spinner disappears
    });
    expect(
      screen.queryByRole('button', { name: 'Accept' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Reject' }),
    ).not.toBeInTheDocument();

    // Now the same component may be reused for another portability request
    // ItemTableRow's currentItemId will change
    const anotherPortabilityRequest = portabilityRequestMockFactory({
      from_playlist: playlistMockFactory({ title: 'playlist FROM 2' }),
      for_playlist: playlistMockFactory({ title: 'playlist FOR 2' }),
      can_accept_or_reject: true,
    });
    rerender(<ItemTableRow item={anotherPortabilityRequest} />);

    expect(
      screen.getByText('playlist FROM 2 wants access to playlist FOR 2'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();
  });

  it('rejects portability request', async () => {
    const portabilityRequest = portabilityRequestMockFactory({
      from_playlist: playlistMockFactory({ title: 'playlist FROM' }),
      for_playlist: playlistMockFactory({ title: 'playlist FOR' }),
      can_accept_or_reject: true,
    });

    const { rerender } = render(<ItemTableRow item={portabilityRequest} />);

    const deferred = new Deferred();
    fetchMock.postOnce(
      `/api/portability-requests/${portabilityRequest.id}/reject/`,
      deferred.promise,
    );

    expect(
      screen.getByText('playlist FROM wants access to playlist FOR'),
    ).toBeInTheDocument();

    act(() => screen.getByRole('button', { name: 'Reject' }).click());

    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument(); // spinner
    });

    expect(
      screen.queryByRole('button', { name: 'Accept' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Reject' }),
    ).not.toBeInTheDocument();

    act(() => deferred.resolve('null'));

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument(); // spinner disappears
    });
    expect(
      screen.queryByRole('button', { name: 'Accept' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Reject' }),
    ).not.toBeInTheDocument();

    // Now the same component may be reused for another portability request
    // ItemTableRow's currentItemId will change
    const anotherPortabilityRequest = portabilityRequestMockFactory({
      from_playlist: playlistMockFactory({ title: 'playlist FROM 2' }),
      for_playlist: playlistMockFactory({ title: 'playlist FOR 2' }),
      can_accept_or_reject: true,
    });
    rerender(<ItemTableRow item={anotherPortabilityRequest} />);

    expect(
      screen.getByText('playlist FROM 2 wants access to playlist FOR 2'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();
  });

  it('displays an error when API call fails (accept)', async () => {
    setLogger({
      log: console.log,
      warn: console.warn,
      // disable the "invalid json response body" error when testing failure
      error: jest.fn(),
    });

    const portabilityRequest = portabilityRequestMockFactory({
      from_playlist: playlistMockFactory({ title: 'playlist FROM' }),
      for_playlist: playlistMockFactory({ title: 'playlist FOR' }),
      can_accept_or_reject: true,
    });

    render(<ItemTableRow item={portabilityRequest} />);

    const deferred = new Deferred();
    fetchMock.postOnce(
      `/api/portability-requests/${portabilityRequest.id}/accept/`,
      deferred.promise,
    );

    expect(
      screen.getByText('playlist FROM wants access to playlist FOR'),
    ).toBeInTheDocument();

    act(() => screen.getByRole('button', { name: 'Accept' }).click());

    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument(); // spinner
    });

    act(() => deferred.reject());

    await waitFor(() => {
      screen.getByText('The requested action has failed please try again');
    });
    expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();
  });

  it('displays an error when API call fails (reject)', async () => {
    setLogger({
      log: console.log,
      warn: console.warn,
      // disable the "invalid json response body" error when testing failure
      error: jest.fn(),
    });

    const portabilityRequest = portabilityRequestMockFactory({
      from_playlist: playlistMockFactory({ title: 'playlist FROM' }),
      for_playlist: playlistMockFactory({ title: 'playlist FOR' }),
      can_accept_or_reject: true,
    });

    render(<ItemTableRow item={portabilityRequest} />);

    const deferred = new Deferred();
    fetchMock.postOnce(
      `/api/portability-requests/${portabilityRequest.id}/reject/`,
      deferred.promise,
    );

    expect(
      screen.getByText('playlist FROM wants access to playlist FOR'),
    ).toBeInTheDocument();

    act(() => screen.getByRole('button', { name: 'Reject' }).click());

    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument(); // spinner
    });

    act(() => deferred.reject());

    await waitFor(() => {
      screen.getByText('The requested action has failed please try again');
    });
    expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();
  });
});
