import { Box, Button, Select, Text } from 'grommet';
import {
  AnonymousUser,
  BinSVG,
  ButtonLoaderStyle,
  Modal,
  ModalButton,
  ModalControlMethods,
  useCurrentUser,
} from 'lib-components';
import { Fragment, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { useDeletePlaylistAccess } from '../api/useDeletePlaylistAccess';
import { useUpdatePlaylistAcess } from '../api/useUpdatePlaylistAccess';
import { PlaylistAccess, PlaylistRole } from '../types/playlistAccess';

import { userRoleOptions } from './UserRoleOptions';

const messages = defineMessages({
  anonymousUser: {
    defaultMessage: 'Anonymous',
    description: 'Update page, playlist access row for user without full name.',
    id: 'features.Playlist.features.UpdatePlaylist.components.UserListRow.anonymousUser',
  },
  deleteUserDescription: {
    defaultMessage:
      'Do you want to remove this user access to this playlist ? Beware, this action is not reversible.',
    description: 'Delete playlist access modal information content.',
    id: 'features.Playlist.features.UpdatePlaylist.components.UserListRow.deleteUserDescription',
  },
  deleteUserConfirmButtonTitle: {
    defaultMessage: 'Delete',
    description: 'Delete playlist access modale confirmation button.',
    id: 'features.Playlist.features.UpdatePlaylist.components.UserListRow.deleteUserConfirmButtonTitle',
  },
  updatePlaylistAccessSuccess: {
    defaultMessage: 'Right has been updated with success.',
    description:
      'Toast message when a playlist access has been updated with success.',
    id: 'features.Playlist.features.UpdatePlaylist.components.UserListRow.updatePlaylistAccessSuccess',
  },
  updatePlaylistAccessError: {
    defaultMessage: 'An error occurred while updating the right.',
    description:
      'Toast message when a playlist access has been updated with error.',
    id: 'features.Playlist.features.UpdatePlaylist.components.UserListRow.updatePlaylistAccessError',
  },
  deleteUserLabel: {
    defaultMessage: 'Delete user {username}.',
    description: 'Delete playlist access button accessibility title.',
    id: 'features.Playlist.features.UpdatePlaylist.components.UserListRow.deleteUserLabel',
  },
  deletePlaylistAccessSuccess: {
    defaultMessage: 'Right deleted with success.',
    description:
      'Toast message when a playlist access has been deleted with success.',
    id: 'features.Playlist.features.UpdatePlaylist.components.UserListRow.deletePlaylistAccessSuccess',
  },
  deletePlaylistAccessError: {
    defaultMessage: 'An error occurred while deleting the right.',
    description:
      'Toast message when a playlist access has been deleted with error.',
    id: 'features.Playlist.features.UpdatePlaylist.components.UserListRow.deletePlaylistAccessError',
  },
});

type Option = { label: string; key: PlaylistRole };
type SelectOnChangeEvent = { option: Option };

interface UserListRowProps {
  playlistAccess: PlaylistAccess;
}

export const UserListRow = ({ playlistAccess }: UserListRowProps) => {
  const intl = useIntl();

  const options = userRoleOptions(intl);
  const initialOption = options.find(
    (option) => option.key === playlistAccess.role,
  );

  const [userRole, setUserRole] = useState(initialOption);
  const modalActions = useRef<ModalControlMethods>(null);
  const { mutate: updateMutation } = useUpdatePlaylistAcess(playlistAccess.id, {
    onSuccess: () => {
      toast.success(intl.formatMessage(messages.updatePlaylistAccessSuccess));
    },
    onError: () => {
      toast.error(intl.formatMessage(messages.updatePlaylistAccessError));
      setUserRole(initialOption);
    },
  });
  const { mutate: deleteMutation } = useDeletePlaylistAccess({
    onSuccess: () => {
      toast.success(intl.formatMessage(messages.deletePlaylistAccessSuccess));
    },
    onError: () => {
      toast.error(intl.formatMessage(messages.deletePlaylistAccessError));
    },
  });
  const { currentUser } = useCurrentUser();

  const idUser =
    currentUser && currentUser !== AnonymousUser.ANONYMOUS
      ? currentUser.id
      : undefined;

  const user = playlistAccess.user;
  let userLabel = intl.formatMessage(messages.anonymousUser, { id: user.id });
  if (user.full_name && user.email) {
    userLabel = `${user.full_name} (${user.email})`;
  } else if (user.full_name) {
    userLabel = user.full_name;
  } else if (user.email) {
    userLabel = user.email;
  }

  return (
    <Fragment>
      <Modal controlMethods={modalActions}>
        <Text margin={{ top: 'small' }}>
          {intl.formatMessage(messages.deleteUserDescription)}
        </Text>
        <ModalButton
          label={intl.formatMessage(messages.deleteUserConfirmButtonTitle)}
          onClickCancel={() => modalActions.current?.close()}
          onClickSubmit={() => deleteMutation(playlistAccess.id)}
          style={ButtonLoaderStyle.DESTRUCTIVE}
        />
      </Modal>

      <Box direction="row" flex gap="small">
        <Box flex={{ grow: 1, shrink: 4 }} margin={{ vertical: 'auto' }}>
          <Text weight="bold" truncate>
            {userLabel}
          </Text>
        </Box>
        <Box
          direction="row"
          flex={{ grow: 0, shrink: 0 }}
          width={{ max: '250px' }}
        >
          <Select
            value={userRole}
            options={options}
            labelKey="label"
            disabled={playlistAccess.user.id === idUser}
            onChange={({ option }: SelectOnChangeEvent) => {
              setUserRole(option);
              updateMutation({ role: option.key });
            }}
          />
          <Button
            plain
            margin={{ left: 'medium' }}
            onClick={() => modalActions.current?.open()}
            disabled={playlistAccess.user.id === idUser}
            a11yTitle={intl.formatMessage(messages.deleteUserLabel, {
              username: playlistAccess.user.full_name,
            })}
          >
            <Box pad="xxsmall">
              <BinSVG iconColor="blue-active" width="18px" height="18px" />
            </Box>
          </Button>
        </Box>
      </Box>
    </Fragment>
  );
};
