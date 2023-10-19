import { Button } from '@openfun/cunningham-react';
import { Box } from 'grommet';
import { Nullable } from 'lib-common';
import { BoxError, BoxLoader, Text } from 'lib-components';
import { Dispatch, SetStateAction } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { UserLite, useSearchUsers } from '../api/useSearchUsers';

import { formatUsername } from './SearchUserListRow';

const messages = defineMessages({
  noResults: {
    defaultMessage: 'No results found.',
    description: 'No results while searching users to add in playlist.',
    id: 'features.Playlist.features.UpdatePlaylist.components.SearchUserList.noResults',
  },
  error: {
    defaultMessage: 'An error occurred, please try again later.',
    description:
      'Message when an error occurred while fetching users to add in playlist.',
    id: 'features.Playlist.features.UpdatePlaylist.components.SearchUserList.error',
  },
  retry: {
    defaultMessage: 'Retry',
    description: 'Retry search users button label.',
    id: 'features.Playlist.features.UpdatePlaylist.components.SearchUserList.retry',
  },
  selectUserLabel: {
    defaultMessage: 'Add user {user} in playlist',
    description: 'Select user to add in playlist button label.',
    id: 'features.Playlist.features.UpdatePlaylist.components.SearchUserList.selectUserLabel',
  },
});

interface SearchUserListProps {
  searchedStr: string;
  setSelectedUser: Dispatch<SetStateAction<Nullable<UserLite>>>;
  excludedUsers?: string[];
}

export const SearchUserList = ({
  searchedStr,
  setSelectedUser,
  excludedUsers,
}: SearchUserListProps) => {
  const intl = useIntl();
  const {
    data: users,
    isLoading,
    isError,
    refetch,
  } = useSearchUsers({
    fullname_or_email__icontains: searchedStr,
    id_not_in: excludedUsers?.join(',') || undefined,
  });

  return (
    <Box margin={{ top: 'small' }}>
      {users && users.count > 0 && (
        <Box gap="small">
          {users.results.map((user, index) => (
            <Button
              key={`user_${index}`}
              aria-label={intl.formatMessage(messages.selectUserLabel, {
                user: user.full_name,
              })}
              onClick={() => setSelectedUser(user)}
              style={{ textAlign: 'start' }}
              color="secondary"
            >
              {formatUsername(user, intl)}
            </Button>
          ))}
        </Box>
      )}
      {isLoading && <BoxLoader />}
      {(!users || users.count === 0) && !isError && !isLoading && (
        <Text type="p">{intl.formatMessage(messages.noResults)}</Text>
      )}
      {isError && (
        <Box>
          <BoxError message={intl.formatMessage(messages.error)} />
          <Button
            aria-label={intl.formatMessage(messages.retry)}
            onClick={() => {
              refetch();
            }}
            style={{ alignSelf: 'center' }}
          >
            {intl.formatMessage(messages.retry)}
          </Button>
        </Box>
      )}
    </Box>
  );
};
