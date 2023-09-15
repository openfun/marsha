import { Input, Select } from '@openfun/cunningham-react';
import { Box, Paragraph } from 'grommet';
import { Nullable } from 'lib-common';
import { Heading, ModalButton } from 'lib-components';
import { debounce } from 'lodash';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { ReactComponent as SearchPeopleIcon } from 'assets/svg/iko_search-people.svg';

import { useCreatePlaylistAccess } from '../api/useCreatePlaylistAccess';
import { UserLite } from '../api/useSearchUsers';
import { PlaylistRole } from '../types/playlistAccess';

import { SearchUserList } from './SearchUserList';
import { SearchUserListRow } from './SearchUserListRow';
import { userRoleOptions } from './UserRoleOptions';

const messages = defineMessages({
  title: {
    defaultMessage: 'Add member',
    description: 'Add member to playlist modal title.',
    id: 'features.Playlist.features.UpdatePlaylist.components.AddUserAccessForm.title',
  },
  back: {
    defaultMessage: 'Back',
    description: 'Back to user selection button title.',
    id: 'features.Playlist.features.UpdatePlaylist.components.AddUserAccessForm.back',
  },
  roleSelectLabel: {
    defaultMessage: 'Select role',
    description: 'Select role for user to add in playlist.',
    id: 'features.Playlist.features.UpdatePlaylist.components.AddUserAccessForm.roleSelectLabel',
  },
  addMember: {
    defaultMessage: 'Add this member',
    description: 'Add member to playlist button title.',
    id: 'features.Playlist.features.UpdatePlaylist.components.AddUserAccessForm.addMember',
  },
  searchInfos: {
    defaultMessage:
      'Search within user and select the one you want to add to this playlist.',
    description: 'Modale description to search user to add into playlist.',
    id: 'features.Playlist.features.UpdatePlaylist.components.AddUserAccessForm.searchInfos',
  },
  placeHolder: {
    defaultMessage: 'Search by username or email address...',
    description: 'Search user input placeholder.',
    id: 'features.Playlist.features.UpdatePlaylist.components.AddUserAccessForm.placeHolder',
  },
});

interface AddUserAccessFormProps {
  playlistId: string;
  onUserAdded: () => void;
  excludedUsers?: string[];
}

export const AddUserAccessForm = ({
  playlistId,
  onUserAdded,
  excludedUsers,
}: AddUserAccessFormProps) => {
  const intl = useIntl();

  const options = useMemo(() => userRoleOptions(intl), [intl]);
  const [searchedUser, setSearchedUser] = useState('');
  const [selectedUser, setSelectedUser] = useState<Nullable<UserLite>>(null);
  const [roleValue, setRoleValue] = useState(
    options.find((option) => option.value === PlaylistRole.STUDENT),
  );
  const { mutate: createPlaylistAccess } = useCreatePlaylistAccess({
    onSuccess: () => {
      onUserAdded();
    },
  });

  const debouncedSetSearchedStr = useRef(
    debounce((str: string) => setSearchedUser(str), 1000),
  ).current;

  // Prevent debounce leak
  useEffect(() => {
    return () => {
      debouncedSetSearchedStr.cancel();
    };
  }, [debouncedSetSearchedStr]);

  return (
    <Box>
      <Heading level={2} className="mt-st" textAlign="center">
        {intl.formatMessage(messages.title)}
      </Heading>

      {selectedUser && (
        <Box gap="small">
          <SearchUserListRow user={selectedUser}>
            <Select
              aria-label={intl.formatMessage(messages.roleSelectLabel)}
              label={intl.formatMessage(messages.roleSelectLabel)}
              options={options}
              onChange={(evt) => {
                setRoleValue(
                  options?.find((option) => option.value === evt.target.value),
                );
              }}
              fullWidth
              value={roleValue?.value}
              clearable={false}
            />
          </SearchUserListRow>
          <ModalButton
            label={intl.formatMessage(messages.addMember)}
            onClickSubmit={() => {
              if (selectedUser && roleValue) {
                createPlaylistAccess({
                  playlist: playlistId,
                  user: selectedUser.id,
                  role: roleValue.value,
                });
              }
            }}
            labelCancel={intl.formatMessage(messages.back)}
            onClickCancel={() => {
              setSelectedUser(null);
            }}
          />
        </Box>
      )}
      {!selectedUser && (
        <Fragment>
          <Paragraph>{intl.formatMessage(messages.searchInfos)}</Paragraph>
          <Input
            aria-label={intl.formatMessage(messages.placeHolder)}
            icon={<SearchPeopleIcon />}
            fullWidth
            label={intl.formatMessage(messages.placeHolder)}
            onChange={(e) => {
              const trimmed = e.target.value.trim();
              debouncedSetSearchedStr(trimmed);
            }}
          />
          {searchedUser !== '' && (
            <SearchUserList
              searchedStr={searchedUser}
              setSelectedUser={setSelectedUser}
              excludedUsers={excludedUsers}
            />
          )}
        </Fragment>
      )}
    </Box>
  );
};
