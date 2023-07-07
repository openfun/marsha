import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { useCurrentUser } from 'lib-components';
import { Deferred, render } from 'lib-tests';
import { Fragment } from 'react';

import { PlaylistRole } from '../types/playlistAccess';

import {
  UserDeleteColumn,
  UserLabelColumn,
  UserRolesColumn,
} from './UserListRow';

const playlistAccess = {
  playlist: {
    consumer_site: null,
    retention_duration: null,
    created_by: 'nobody',
    created_on: '2021-03-18T14:00:00Z',
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
};

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
      <Fragment>
        <UserLabelColumn user={playlistAccess.user} />
        <UserRolesColumn
          playlistAccessId={playlistAccess.id}
          role={playlistAccess.role}
          userId={playlistAccess.user.id}
        />
        <UserDeleteColumn
          playlistAccessId={playlistAccess.id}
          userId={playlistAccess.user.id}
        />
      </Fragment>,
    );

    expect(
      screen.getByText('my full name (my-email@openfun.fr)'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Open Drop/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('Administrator');
    expect(
      screen.getByRole('button', { name: 'Delete user.' }),
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
      <UserRolesColumn
        playlistAccessId={playlistAccess.id}
        role={playlistAccess.role}
        userId={playlistAccess.user.id}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /Open Drop/ }));

    const instructorOption = screen.getByRole('option', {
      name: 'Instructor',
    });
    expect(instructorOption).toBeInTheDocument();

    await userEvent.click(instructorOption);

    expect(screen.getByRole('textbox')).toHaveValue('Instructor');
    expect(
      await screen.findByText('Right has been updated with success.'),
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(fetchMock.lastCall()![0]).toEqual(
        '/api/playlist-accesses/some-id/',
      ),
    );
  });

  it('updates playlist access role and raises an error and reset state if an error occured', async () => {
    const deferred = new Deferred();
    fetchMock.mock('/api/playlist-accesses/some-id/', deferred.promise, {
      method: 'PATCH',
    });

    render(
      <UserRolesColumn
        playlistAccessId={playlistAccess.id}
        role={playlistAccess.role}
        userId={playlistAccess.user.id}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /Open Drop/ }));

    const instructorOption = screen.getByRole('option', {
      name: 'Instructor',
    });
    expect(instructorOption).toBeInTheDocument();

    await userEvent.click(instructorOption);

    expect(screen.getByRole('textbox')).toHaveValue('Instructor');

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
      <UserDeleteColumn
        playlistAccessId={playlistAccess.id}
        userId={playlistAccess.user.id}
      />,
    );

    await userEvent.click(
      await screen.findByRole('button', { name: 'Delete user.' }),
    );

    expect(
      screen.getByText(
        'Do you want to remove this user access to this playlist ? Beware, this action is not reversible.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(screen.getByText('Right deleted with success.')).toBeInTheDocument();

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
      <UserDeleteColumn
        playlistAccessId={playlistAccess.id}
        userId={playlistAccess.user.id}
      />,
    );

    await userEvent.click(
      await screen.findByRole('button', { name: 'Delete user.' }),
    );

    expect(
      screen.getByText(
        'Do you want to remove this user access to this playlist ? Beware, this action is not reversible.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(
      screen.getByText('An error occurred while deleting the right.'),
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
      <Fragment>
        <UserLabelColumn user={playlistAccess.user} />
        <UserRolesColumn
          playlistAccessId={playlistAccess.id}
          role={playlistAccess.role}
          userId="my-id"
        />
        <UserDeleteColumn playlistAccessId={playlistAccess.id} userId="my-id" />
      </Fragment>,
    );

    expect(
      screen.getByText('my full name (my-email@openfun.fr)'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open Drop/ })).toBeDisabled();
    expect(screen.getByRole('textbox')).toHaveValue('Administrator');
    expect(screen.getByRole('button', { name: 'Delete user.' })).toBeDisabled();
  });
});
