import { Box, Button, Paragraph } from 'grommet';
import { Nullable } from 'lib-common';
import { Spinner } from 'lib-components';
import { Dispatch, SetStateAction } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { UserLite, useSearchUsers } from '../api/useSearchUsers';

import { SearchUserListRow } from './SearchUserListRow';

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
              a11yTitle={intl.formatMessage(messages.selectUserLabel, {
                user: user.full_name,
              })}
              plain
              onClick={() => setSelectedUser(user)}
              style={{ textAlign: 'start' }}
            >
              {({ hover, focus }) => (
                <SearchUserListRow hover={hover} focus={focus} user={user} />
              )}
            </Button>
          ))}
        </Box>
      )}
      {isLoading && <Spinner />}
      {(!users || users.count === 0) && !isError && !isLoading && (
        <Paragraph>{intl.formatMessage(messages.noResults)}</Paragraph>
      )}
      {isError && (
        <Box>
          <Paragraph>{intl.formatMessage(messages.error)}</Paragraph>
          <Button
            label={intl.formatMessage(messages.retry)}
            onClick={() => {
              refetch();
            }}
          />
        </Box>
      )}
    </Box>
  );
};
