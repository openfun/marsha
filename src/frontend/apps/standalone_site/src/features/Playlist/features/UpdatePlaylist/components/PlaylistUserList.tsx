import { Button, DataGrid, usePagination } from '@openfun/cunningham-react';
import { Box } from 'grommet';
import { BoxLoader, Text } from 'lib-components';
import { useEffect } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { ITEM_PER_PAGE } from 'conf/global';

import { usePlaylistAccess } from '../api/usePlaylistAccess';

import {
  UserDeleteColumn,
  UserLabelColumn,
  UserRolesColumn,
} from './UserListRow';

const messages = defineMessages({
  errorLoadingPlaylist: {
    defaultMessage: 'An error occurred, please try again later.',
    description: 'Message when an error occurred while fetching it.',
    id: 'features.Playlist.features.UpdatePlaylist.components.PlaylistUserList.errorLoadingPlaylist',
  },
  retryLoadPlaylist: {
    defaultMessage: 'Retry',
    description:
      'Button title to reload playlist data when error occurred while fetching it.',
    id: 'features.Playlist.features.UpdatePlaylist.components.PlaylistUserList.retryLoadPlaylist',
  },
  noAccess: {
    defaultMessage:
      'There are no access configured for this playlist. Please contact your administrator.',
    description:
      'Message when there are no playlist access related to a playlist in this playlist page settings.',
    id: 'features.Playlist.features.UpdatePlaylist.components.PlaylistUserList.noAccess',
  },
  columnNameUsers: {
    defaultMessage: 'Users',
    description: 'The column name "Users" on the playlist user datagrid.',
    id: 'features.Playlist.features.UpdatePlaylist.components.PlaylistUserList.columnNameUsers',
  },
  columnNameRoles: {
    defaultMessage: 'Roles',
    description: 'The column name "Roles" on the playlist user datagrid.',
    id: 'features.Playlist.features.UpdatePlaylist.components.PlaylistUserList.columnNameRoles',
  },
});

interface PlaylistUserListProps {
  playlistId: string;
}

export const PlaylistUserList = ({ playlistId }: PlaylistUserListProps) => {
  const intl = useIntl();

  const pagination = usePagination({
    defaultPage: 1,
    pageSize: ITEM_PER_PAGE,
  });

  const { page, pageSize, setPagesCount } = pagination;

  const { data, isLoading, isError, refetch } = usePlaylistAccess({
    playlist_id: playlistId,
    offset: `${(page - 1) * ITEM_PER_PAGE}`,
    limit: `${ITEM_PER_PAGE}`,
  });

  useEffect(() => {
    setPagesCount(data?.count ? Math.ceil(data?.count / pageSize) : 0);
  }, [data?.count, pageSize, setPagesCount]);

  if (isLoading && !isError) {
    return <BoxLoader />;
  }

  if (isError) {
    return (
      <Box width="large">
        <Text textAlign="center">
          {intl.formatMessage(messages.errorLoadingPlaylist)}
        </Text>
        <Box margin="auto" pad={{ top: 'medium' }}>
          <Button
            onClick={() => {
              refetch();
            }}
            aria-label={intl.formatMessage(messages.retryLoadPlaylist)}
          >
            {intl.formatMessage(messages.retryLoadPlaylist)}
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {data && data.count ? (
        <DataGrid
          columns={[
            {
              id: 'column-user',
              headerName: intl.formatMessage(messages.columnNameUsers),
              renderCell: ({ row: playlistAccess }) => (
                <UserLabelColumn user={playlistAccess.user} />
              ),
            },
            {
              id: 'column-role',
              headerName: intl.formatMessage(messages.columnNameRoles),
              renderCell: ({ row: playlistAccess }) => (
                <UserRolesColumn
                  playlistAccessId={playlistAccess.id}
                  role={playlistAccess.role}
                  userId={playlistAccess.user.id}
                />
              ),
            },
            {
              id: 'column-delete-user',
              renderCell: ({ row: playlistAccess }) => (
                <UserDeleteColumn
                  playlistAccessId={playlistAccess.id}
                  userId={playlistAccess.user.id}
                />
              ),
            },
          ]}
          rows={data?.results || []}
          pagination={pagination}
          isLoading={isLoading}
        />
      ) : (
        <Text textAlign="center">{intl.formatMessage(messages.noAccess)}</Text>
      )}
    </Box>
  );
};
