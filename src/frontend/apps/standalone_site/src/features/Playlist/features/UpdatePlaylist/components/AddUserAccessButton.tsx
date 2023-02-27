import { Box, Button } from 'grommet';
import { Fragment, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { Modal } from 'components/Modal';

import { AddUserAccessForm } from './AddUserAccessForm';

const messages = defineMessages({
  buttonLabel: {
    defaultMessage: 'Add people',
    description: 'Add member to playlist button label.',
    id: 'features.Playlist.features.UpdatePlaylist.components.AddUserAccessButton.buttonLabel',
  },
});

interface AddUserAccessButtonProps {
  playlistId: string;
  excludedUsers?: string[];
}

export const AddUserAccessButton = ({
  playlistId,
  excludedUsers,
}: AddUserAccessButtonProps) => {
  const intl = useIntl();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <Fragment>
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
        }}
      >
        <AddUserAccessForm
          playlistId={playlistId}
          excludedUsers={excludedUsers}
          onUserAdded={() => {
            setIsModalOpen(false);
          }}
        />
      </Modal>

      <Box margin={{ left: 'auto', vertical: 'small' }}>
        <Button
          primary
          label={intl.formatMessage(messages.buttonLabel)}
          onClick={() => {
            setIsModalOpen(true);
          }}
        />
      </Box>
    </Fragment>
  );
};
