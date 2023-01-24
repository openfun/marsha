import { Box, Button, Text } from 'grommet';
import { Spinner } from 'lib-components';
import { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { SortableTable } from 'components/SortableTable';
import { ITEM_PER_PAGE } from 'conf/global';

import { usePlaylistAccess } from '../api/usePlaylistAccess';

import { UserListRow } from './UserListRow';

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
});

interface PlaylistUserListProps {
  playlistId: string;
}

export const PlaylistUserList = ({ playlistId }: PlaylistUserListProps) => {
  const intl = useIntl();
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading, isError, refetch } = usePlaylistAccess({
    playlist_id: playlistId,
    offset: `${(currentPage - 1) * ITEM_PER_PAGE}`,
    limit: `${ITEM_PER_PAGE}`,
  });

  if (isLoading && !isError) {
    return (
      <Box width="large" margin="auto">
        <Box margin="auto">
          <Spinner />
        </Box>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box width="large">
        <Text>{intl.formatMessage(messages.errorLoadingPlaylist)}</Text>
        <Box margin="auto" pad={{ top: 'medium' }}>
          <Button
            onClick={() => {
              refetch();
            }}
            primary
            label={intl.formatMessage(messages.retryLoadPlaylist)}
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {data && data.count > 0 && (
        <SortableTable
          loading={isLoading}
          title={`${data.count} membres`}
          items={data.results}
          paginable
          numberOfItems={data.count}
          pageSize={ITEM_PER_PAGE}
          onPageChange={(newPage) => {
            setCurrentPage(newPage);
            return data.results;
          }}
        >
          {(playlistAccess) => <UserListRow playlistAccess={playlistAccess} />}
        </SortableTable>
      )}
      {(!data || data.count === 0) && (
        <Text>{intl.formatMessage(messages.noAccess)}</Text>
      )}
    </Box>
  );
};
