import { Box, Heading, Paragraph, Select } from 'grommet';
import { Nullable } from 'lib-common';
import { TextInput } from 'lib-components';
import { debounce } from 'lodash';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { ReactComponent as SearchPeopleIcon } from 'assets/svg/iko_search-people.svg';
import { ModalButton } from 'components/Modal';

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
  const [typedStr, setTypedStr] = useState('');
  const [searchedUser, setSearchedUser] = useState('');
  const [selectedUser, setSelectedUser] = useState<Nullable<UserLite>>(null);
  const [roleValue, setRoleValue] = useState(
    options.find((option) => option.key === PlaylistRole.STUDENT),
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
      <Heading
        level={2}
        margin={{ top: 'xxsmall' }}
        textAlign="center"
        weight="bold"
      >
        {intl.formatMessage(messages.title)}
      </Heading>

      {selectedUser && (
        <Box gap="small">
          <SearchUserListRow user={selectedUser}>
            <Select
              a11yTitle={intl.formatMessage(messages.roleSelectLabel)}
              labelKey="label"
              value={roleValue}
              options={options}
              onChange={({
                option,
              }: {
                option: { label: string; key: PlaylistRole };
              }) => {
                setRoleValue(option);
              }}
            />
          </SearchUserListRow>
          <ModalButton
            label={intl.formatMessage(messages.addMember)}
            onClickSubmit={() => {
              if (selectedUser && roleValue) {
                createPlaylistAccess({
                  playlist: playlistId,
                  user: selectedUser.id,
                  role: roleValue.key,
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

          <TextInput
            value={typedStr}
            setValue={(newValue) => {
              const trimmed = newValue.trim();
              setTypedStr(trimmed);
              debouncedSetSearchedStr(trimmed);
            }}
            placeholder={intl.formatMessage(messages.placeHolder)}
            a11yTitle={intl.formatMessage(messages.placeHolder)}
            icon={<SearchPeopleIcon />}
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
