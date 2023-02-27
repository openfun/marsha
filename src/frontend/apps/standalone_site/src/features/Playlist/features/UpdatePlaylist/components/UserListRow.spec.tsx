import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { useCurrentUser } from 'lib-components';
import { Deferred, render } from 'lib-tests';
import { setLogger } from 'react-query';

import { PlaylistRole } from '../types/playlistAccess';

import { UserListRow } from './UserListRow';

setLogger({ log: console.log, warn: console.warn, error: () => {} });

describe('<UserListRow />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();

    useCurrentUser.setState({
      currentUser: {
        id: 'my-id',
        is_staff: false,
        is_superuser: false,
        organization_accesses: [],
      },
    });
  });

  it('renders the access row', async () => {
    render(
      <UserListRow
        playlistAccess={{
          playlist: {
            consumer_site: null,
            created_by: 'nobody',
            duplicated_from: null,
            is_portable_to_playlist: false,
            is_portable_to_consumer_site: false,
            is_public: false,
            lti_id: 'some lti id',
            organization: { name: 'my organization', id: 'my orga id' },
            portable_to: [],
            title: 'playlist title',
            users: [],
            id: 'playlist id',
          },
          id: 'some-id',
          role: PlaylistRole.ADMINISTRATOR,
          user: {
            full_name: 'my full name',
            email: 'my-email@openfun.fr',
            id: 'my user id',
            is_staff: false,
            is_superuser: false,
          },
        }}
      />,
    );

    expect(
      screen.getByText('my full name (my-email@openfun.fr)'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Open Drop/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('Administrator');
    expect(
      screen.getByRole('button', { name: 'Delete user my full name.' }),
    ).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: /Open Drop/ }));

    expect(
      await screen.findByRole('option', { name: 'Instructor' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Student' })).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Administrator' }),
    ).toBeInTheDocument();
  });

  it('updates playlist access role', async () => {
    fetchMock.mock(
      '/api/playlist-accesses/some-id/',
      { ok: true },
      { method: 'PATCH' },
    );

    render(
      <UserListRow
        playlistAccess={{
          playlist: {
            consumer_site: null,
            created_by: 'nobody',
            duplicated_from: null,
            is_portable_to_playlist: false,
            is_portable_to_consumer_site: false,
            is_public: false,
            lti_id: 'some lti id',
            organization: { name: 'my organization', id: 'my orga id' },
            portable_to: [],
            title: 'playlist title',
            users: [],
            id: 'playlist id',
          },
          id: 'some-id',
          role: PlaylistRole.ADMINISTRATOR,
          user: {
            full_name: 'my full name',
            email: 'my-email@openfun.fr',
            id: 'my user id',
            is_staff: false,
            is_superuser: false,
          },
        }}
      />,
    );

    userEvent.click(screen.getByRole('button', { name: /Open Drop/ }));

    const instructorOption = await screen.findByRole('option', {
      name: 'Instructor',
    });
    expect(instructorOption).toBeInTheDocument();

    userEvent.click(instructorOption);

    await waitFor(async () =>
      expect(await screen.findByRole('textbox')).toHaveValue('Instructor'),
    );

    expect(
      await screen.findByText('Right has been updated with success.'),
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(fetchMock.lastCall()![0]).toEqual(
        '/api/playlist-accesses/some-id/',
      ),
    );
  });

  it('raises an error and reset state if an error occured', async () => {
    const deferred = new Deferred();
    fetchMock.mock('/api/playlist-accesses/some-id/', deferred.promise, {
      method: 'PATCH',
    });

    render(
      <UserListRow
        playlistAccess={{
          playlist: {
            consumer_site: null,
            created_by: 'nobody',
            duplicated_from: null,
            is_portable_to_playlist: false,
            is_portable_to_consumer_site: false,
            is_public: false,
            lti_id: 'some lti id',
            organization: { name: 'my organization', id: 'my orga id' },
            portable_to: [],
            title: 'playlist title',
            users: [],
            id: 'playlist id',
          },
          id: 'some-id',
          role: PlaylistRole.ADMINISTRATOR,
          user: {
            full_name: 'my full name',
            email: 'my-email@openfun.fr',
            id: 'my user id',
            is_staff: false,
            is_superuser: false,
          },
        }}
      />,
    );

    userEvent.click(screen.getByRole('button', { name: /Open Drop/ }));

    const instructorOption = await screen.findByRole('option', {
      name: 'Instructor',
    });
    expect(instructorOption).toBeInTheDocument();

    userEvent.click(instructorOption);

    await waitFor(async () =>
      expect(await screen.findByRole('textbox')).toHaveValue('Instructor'),
    );

    deferred.reject();

    expect(
      await screen.findByText('An error occurred while updating the right.'),
    ).toBeInTheDocument();

    expect(screen.getByRole('textbox')).toHaveValue('Administrator');
  });

  it('calls for delete', async () => {
    fetchMock.mock(
      '/api/playlist-accesses/some-id/',
      { ok: true },
      { method: 'DELETE' },
    );

    render(
      <UserListRow
        playlistAccess={{
          playlist: {
            consumer_site: null,
            created_by: 'nobody',
            duplicated_from: null,
            is_portable_to_playlist: false,
            is_portable_to_consumer_site: false,
            is_public: false,
            lti_id: 'some lti id',
            organization: { name: 'my organization', id: 'my orga id' },
            portable_to: [],
            title: 'playlist title',
            users: [],
            id: 'playlist id',
          },
          id: 'some-id',
          role: PlaylistRole.ADMINISTRATOR,
          user: {
            full_name: 'my full name',
            email: 'my-email@openfun.fr',
            id: 'my user id',
            is_staff: false,
            is_superuser: false,
          },
        }}
      />,
    );

    userEvent.click(
      await screen.findByRole('button', { name: 'Delete user my full name.' }),
    );

    expect(
      await screen.findByText(
        'Do you want to remove this user access to this playlist ? Beware, this action is not reversible.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(
      await screen.findByText('Right deleted with success.'),
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(fetchMock.lastCall()![0]).toEqual(
        '/api/playlist-accesses/some-id/',
      ),
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: { 'Content-Type': 'application/json' },
      method: 'DELETE',
    });
  });

  it('raises an error if we fail to delete', async () => {
    fetchMock.mock('/api/playlist-accesses/some-id/', 500, {
      method: 'DELETE',
    });

    render(
      <UserListRow
        playlistAccess={{
          playlist: {
            consumer_site: null,
            created_by: 'nobody',
            duplicated_from: null,
            is_portable_to_playlist: false,
            is_portable_to_consumer_site: false,
            is_public: false,
            lti_id: 'some lti id',
            organization: { name: 'my organization', id: 'my orga id' },
            portable_to: [],
            title: 'playlist title',
            users: [],
            id: 'playlist id',
          },
          id: 'some-id',
          role: PlaylistRole.ADMINISTRATOR,
          user: {
            full_name: 'my full name',
            email: 'my-email@openfun.fr',
            id: 'my user id',
            is_staff: false,
            is_superuser: false,
          },
        }}
      />,
    );

    userEvent.click(
      await screen.findByRole('button', { name: 'Delete user my full name.' }),
    );

    expect(
      await screen.findByText(
        'Do you want to remove this user access to this playlist ? Beware, this action is not reversible.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(
      await screen.findByText('An error occurred while deleting the right.'),
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(fetchMock.lastCall()![0]).toEqual(
        '/api/playlist-accesses/some-id/',
      ),
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: { 'Content-Type': 'application/json' },
      method: 'DELETE',
    });
  });

  it('disables actions for the user currently connected', () => {
    render(
      <UserListRow
        playlistAccess={{
          playlist: {
            consumer_site: null,
            created_by: 'nobody',
            duplicated_from: null,
            is_portable_to_playlist: false,
            is_portable_to_consumer_site: false,
            is_public: false,
            lti_id: 'some lti id',
            organization: { name: 'my organization', id: 'my orga id' },
            portable_to: [],
            title: 'playlist title',
            users: [],
            id: 'playlist id',
          },
          id: 'some-id',
          role: PlaylistRole.ADMINISTRATOR,
          user: {
            full_name: 'my full name',
            email: 'my-email@openfun.fr',
            id: 'my-id',
            is_staff: false,
            is_superuser: false,
          },
        }}
      />,
    );

    expect(
      screen.getByText('my full name (my-email@openfun.fr)'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open Drop/ })).toBeDisabled();
    expect(screen.getByRole('textbox')).toHaveValue('Administrator');
    expect(
      screen.getByRole('button', { name: 'Delete user my full name.' }),
    ).toBeDisabled();
  });
});
