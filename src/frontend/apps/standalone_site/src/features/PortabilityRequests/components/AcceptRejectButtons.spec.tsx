import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import {
  playlistMockFactory,
  portabilityRequestMockFactory,
} from 'lib-components/tests';
import { Deferred, render } from 'lib-tests';

import { AcceptRejectButtons } from './AcceptRejectButtons';

describe('<AcceptRejectButtons />', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  it('renders buttons if it can', () => {
    const portabilityRequest = portabilityRequestMockFactory({
      can_accept_or_reject: true,
    });

    render(
      <AcceptRejectButtons
        portabilityRequestId={portabilityRequest.id}
        canAcceptOrReject={portabilityRequest.can_accept_or_reject}
      />,
    );

    expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();
  });

  it("doesn't renders buttons if it cannot", () => {
    const portabilityRequest = portabilityRequestMockFactory({
      can_accept_or_reject: false,
    });

    render(
      <AcceptRejectButtons
        portabilityRequestId={portabilityRequest.id}
        canAcceptOrReject={portabilityRequest.can_accept_or_reject}
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'Accept' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Reject' }),
    ).not.toBeInTheDocument();
  });

  it('accepts portability request', async () => {
    const portabilityRequest = portabilityRequestMockFactory({
      can_accept_or_reject: true,
    });

    render(
      <AcceptRejectButtons
        portabilityRequestId={portabilityRequest.id}
        canAcceptOrReject={portabilityRequest.can_accept_or_reject}
      />,
    );

    const deferred = new Deferred();
    fetchMock.postOnce(
      `/api/portability-requests/${portabilityRequest.id}/accept/`,
      deferred.promise,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Accept' }));

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
  });

  it('rejects portability request', async () => {
    const portabilityRequest = portabilityRequestMockFactory({
      can_accept_or_reject: true,
    });

    render(
      <AcceptRejectButtons
        portabilityRequestId={portabilityRequest.id}
        canAcceptOrReject={portabilityRequest.can_accept_or_reject}
      />,
    );

    const deferred = new Deferred();
    fetchMock.postOnce(
      `/api/portability-requests/${portabilityRequest.id}/reject/`,
      deferred.promise,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Reject' }));
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
  });

  it('displays an error when API call fails (accept)', async () => {
    const portabilityRequest = portabilityRequestMockFactory({
      can_accept_or_reject: true,
    });

    render(
      <AcceptRejectButtons
        portabilityRequestId={portabilityRequest.id}
        canAcceptOrReject={portabilityRequest.can_accept_or_reject}
      />,
    );

    const deferred = new Deferred();
    fetchMock.postOnce(
      `/api/portability-requests/${portabilityRequest.id}/accept/`,
      deferred.promise,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Accept' }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument(); // spinner
    });

    act(() => deferred.reject());

    await waitFor(() => {
      screen.getByText('The requested action has failed please try again');
    });
    expect(
      await screen.findByRole('button', { name: 'Accept' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();
  });

  it('displays an error when API call fails (reject)', async () => {
    const portabilityRequest = portabilityRequestMockFactory({
      from_playlist: playlistMockFactory({ title: 'playlist FROM' }),
      for_playlist: playlistMockFactory({ title: 'playlist FOR' }),
      can_accept_or_reject: true,
    });

    render(
      <AcceptRejectButtons
        portabilityRequestId={portabilityRequest.id}
        canAcceptOrReject={portabilityRequest.can_accept_or_reject}
      />,
    );

    const deferred = new Deferred();
    fetchMock.postOnce(
      `/api/portability-requests/${portabilityRequest.id}/reject/`,
      deferred.promise,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Reject' }));
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
