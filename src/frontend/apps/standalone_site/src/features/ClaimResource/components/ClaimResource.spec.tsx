import { screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { useCurrentUser, useJwt } from 'lib-components';
import { playlistMockFactory, userMockFactory } from 'lib-components/tests';
import { render } from 'lib-tests';

import { ClaimResource } from './ClaimResource';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// don't pollute test output with react-query errors
const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<ClaimResource />', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
    useCurrentUser.setState({
      currentUser: userMockFactory({
        id: '23fc4a',
      }),
    });
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
    useJwt.getState().resetJwt();
    consoleError.mockClear();
  });

  it('creates a user association and claims playlist', async () => {
    const playlist = playlistMockFactory();
    fetchMock.get(`/api/playlists/${playlist.id}/`, playlist);
    fetchMock.postOnce('/api/lti-user-associations/', 'null');
    fetchMock.postOnce(`/api/playlists/${playlist.id}/claim/`, playlist);

    render(<ClaimResource />, {
      routerOptions: {
        history: [
          `/my-contents/claim-resource?lti_consumer_site_id=36fff96e&resource_id=81d56c42&modelName=classrooms&playlist_id=${playlist.id}&lti_user_id=7ff674f`,
        ],
      },
    });

    expect(screen.getByText('Claiming resource…')).toBeInTheDocument();

    expect(
      await screen.findByText(
        'Your account has been successfully linked to the LMS identifiers.',
      ),
    ).toBeInTheDocument();

    expect(
      await screen.findByText('Resource claimed with success.'),
    ).toBeInTheDocument();

    expect(fetchMock.calls()[0][0]).toEqual('/api/lti-user-associations/');
    expect(fetchMock.calls()[0][1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'POST',
      body: JSON.stringify({
        lti_consumer_site_id: '36fff96e',
        lti_user_id: '7ff674f',
      }),
    });

    expect(fetchMock.calls()[1][0]).toEqual(
      `/api/playlists/${playlist.id}/claim/`,
    );
    expect(fetchMock.calls()[1][1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'POST',
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        '/my-contents/classroom/81d56c42',
      );
    });
  });

  it('only claims playlist when user already associated', async () => {
    const playlist = playlistMockFactory();
    fetchMock.get(`/api/playlists/${playlist.id}/`, playlist);
    fetchMock.postOnce('/api/lti-user-associations/', 409);
    fetchMock.postOnce(`/api/playlists/${playlist.id}/claim/`, playlist);

    render(<ClaimResource />, {
      routerOptions: {
        history: [
          `/my-contents/claim-resource?lti_consumer_site_id=36fff96e&resource_id=81d56c42&modelName=classrooms&playlist_id=${playlist.id}&lti_user_id=7ff674f`,
        ],
      },
    });

    expect(screen.getByText('Claiming resource…')).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.queryByText(
          'Your account has been successfully linked to the LMS identifiers.',
        ),
      ).not.toBeInTheDocument();
    });

    expect(
      await screen.findByText('Resource claimed with success.'),
    ).toBeInTheDocument();

    expect(fetchMock.calls()[0][0]).toEqual('/api/lti-user-associations/');
    expect(fetchMock.calls()[0][1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'POST',
      body: JSON.stringify({
        lti_consumer_site_id: '36fff96e',
        lti_user_id: '7ff674f',
      }),
    });

    expect(fetchMock.calls()[1][0]).toEqual(
      `/api/playlists/${playlist.id}/claim/`,
    );
    expect(fetchMock.calls()[1][1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'POST',
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        '/my-contents/classroom/81d56c42',
      );
    });
  });

  it('displays errors for user association and claim playlist', async () => {
    const playlist = playlistMockFactory();
    fetchMock.get(`/api/playlists/${playlist.id}/`, playlist);
    fetchMock.postOnce('/api/lti-user-associations/', 500);
    fetchMock.postOnce(`/api/playlists/${playlist.id}/claim/`, 500);

    render(<ClaimResource />, {
      routerOptions: {
        history: [
          `/my-contents/claim-resource?lti_consumer_site_id=36fff96e&resource_id=81d56c42&modelName=classrooms&playlist_id=${playlist.id}&lti_user_id=7ff674f`,
        ],
      },
    });

    expect(screen.getByText('Claiming resource…')).toBeInTheDocument();

    expect(
      await screen.findByText(
        'An error occurred when linking your account to the LMS identifiers, please try to refresh the page.',
      ),
    ).toBeInTheDocument();

    expect(
      await screen.findByText('An error occurred when claiming the resource.'),
    ).toBeInTheDocument();

    expect(fetchMock.calls()[0][0]).toEqual('/api/lti-user-associations/');
    expect(fetchMock.calls()[0][1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'POST',
      body: JSON.stringify({
        lti_consumer_site_id: '36fff96e',
        lti_user_id: '7ff674f',
      }),
    });

    expect(fetchMock.calls()[1][0]).toEqual(
      `/api/playlists/${playlist.id}/claim/`,
    );
    expect(fetchMock.calls()[1][1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'POST',
    });

    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
