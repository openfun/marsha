import { Select } from '@openfun/cunningham-react';
import { Box, Button, Text } from 'grommet';
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
import { useUpdatePlaylistAccess } from '../api/useUpdatePlaylistAccess';
import { PlaylistAccess, PlaylistRole } from '../types/playlistAccess';

import { userRoleOptions } from './UserRoleOptions';

const messages = defineMessages({
  labelSelectRole: {
    defaultMessage: 'Role',
    description: 'The label on the select role input.',
    id: 'features.Playlist.features.UpdatePlaylist.components.UserListRow.labelSelectRole',
  },
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
    defaultMessage: 'Delete user.',
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

interface UserLabelColumnProps {
  user: PlaylistAccess['user'];
}

export const UserLabelColumn = ({ user }: UserLabelColumnProps) => {
  const intl = useIntl();
  let userLabel = intl.formatMessage(messages.anonymousUser, { id: user.id });
  if (user.full_name && user.email) {
    userLabel = `${user.full_name} (${user.email})`;
  } else if (user.full_name) {
    userLabel = user.full_name;
  } else if (user.email) {
    userLabel = user.email;
  }

  return (
    <Text
      truncate
      style={{
        display: 'block',
        whiteSpace: 'normal',
      }}
    >
      {userLabel}
    </Text>
  );
};

interface UserRolesColumnProps {
  playlistAccessId: PlaylistAccess['id'];
  role: PlaylistAccess['role'];
  userId: PlaylistAccess['user']['id'];
}

export const UserRolesColumn = ({
  playlistAccessId,
  role,
  userId,
}: UserRolesColumnProps) => {
  const intl = useIntl();

  const options = userRoleOptions(intl);
  const initialRole = options.find((option) => option.value === role)?.value;
  const [userRole, setUserRole] = useState(initialRole);

  const { mutate: updateMutation } = useUpdatePlaylistAccess(playlistAccessId, {
    onSuccess: () => {
      toast.success(intl.formatMessage(messages.updatePlaylistAccessSuccess));
    },
    onError: () => {
      toast.error(intl.formatMessage(messages.updatePlaylistAccessError));
      setUserRole(initialRole);
    },
  });
  const { currentUser } = useCurrentUser();

  const idUser =
    currentUser && currentUser !== AnonymousUser.ANONYMOUS
      ? currentUser.id
      : undefined;

  return (
    <Select
      className="c_select__no_border"
      aria-label={intl.formatMessage(messages.labelSelectRole)}
      label={intl.formatMessage(messages.labelSelectRole)}
      hideLabel
      disabled={userId === idUser}
      options={options}
      onChange={(evt) => {
        if (evt.target.value === userRole) {
          return;
        }

        setUserRole(evt.target.value as PlaylistRole);
        updateMutation({ role: evt.target.value as PlaylistRole });
      }}
      fullWidth
      value={userRole}
      clearable={false}
    />
  );
};

interface UserDeleteColumnProps {
  playlistAccessId: PlaylistAccess['id'];
  userId: PlaylistAccess['user']['id'];
}

export const UserDeleteColumn = ({
  playlistAccessId,
  userId,
}: UserDeleteColumnProps) => {
  const intl = useIntl();
  const modalActions = useRef<ModalControlMethods>(null);

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

  return (
    <Fragment>
      <Modal controlMethods={modalActions}>
        <Text margin={{ top: 'small' }}>
          {intl.formatMessage(messages.deleteUserDescription)}
        </Text>
        <ModalButton
          label={intl.formatMessage(messages.deleteUserConfirmButtonTitle)}
          onClickCancel={() => modalActions.current?.close()}
          onClickSubmit={() => deleteMutation(playlistAccessId)}
          style={ButtonLoaderStyle.DESTRUCTIVE}
        />
      </Modal>

      <Button
        plain
        margin={{ left: 'medium' }}
        onClick={() => modalActions.current?.open()}
        disabled={userId === idUser}
        a11yTitle={intl.formatMessage(messages.deleteUserLabel)}
      >
        <Box pad="xxsmall">
          <BinSVG iconColor="blue-active" width="18px" height="18px" />
        </Box>
      </Button>
    </Fragment>
  );
};
