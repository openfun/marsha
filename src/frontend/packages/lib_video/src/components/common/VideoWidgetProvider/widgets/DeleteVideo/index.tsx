import { Button } from 'grommet';
import {
  ConfirmationModal,
  FoldableItem,
  report,
  useCurrentResourceContext,
} from 'lib-components';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';

import { useDeleteVideo } from '@lib-video/api/useDeleteVideo';
import { useCurrentVideo } from '@lib-video/hooks';

const messages = defineMessages({
  info: {
    defaultMessage:
      'DANGER ZONE : This widget allows you to delete the resource permanently.',
    description: 'Info of the widget used for deleting the video.',
    id: 'components.DeleteVideo.info',
  },
  title: {
    defaultMessage: 'DANGER ZONE',
    description: 'Title of the widget used for deleting the video.',
    id: 'components.DeleteVideo.title',
  },
  confirmDeleteTitle: {
    defaultMessage: 'Confirm delete',
    description: 'Title of the widget used for confirmation.',
    id: 'components.DeleteVideoConfirm.title',
  },
  confirmDeleteText: {
    defaultMessage:
      'Are you sure you want to delete this resource ? This action is irreversible.',
    description: 'Text of the widget used for confirmation.',
    id: 'components.DeleteVideoConfirm.text',
  },
  deleteButtonText: {
    defaultMessage: 'Delete',
    description: 'Text of the delete button.',
    id: 'components.DeleteVideoButton.text',
  },
  videoDeleteSuccess: {
    defaultMessage: 'Resource successfully deleted',
    description: 'Text of the delete confirmation toast.',
    id: 'components.deleteVideoSuccess.text',
  },
  videoDeleteError: {
    defaultMessage: 'Failed to delete the resource',
    description: 'ext of the delete error toast..',
    id: 'components.videoDeleteError.text',
  },
});

const StyledAnchorButton = styled(Button)`
  height: 50px;
  font-family: 'Roboto-Medium';
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const DeleteVideo = () => {
  const intl = useIntl();
  const [context] = useCurrentResourceContext();
  const history = useHistory();
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] =
    useState(false);
  const video = useCurrentVideo();
  const deleteVideo = useDeleteVideo({
    onSuccess: () => {
      toast.success(intl.formatMessage(messages.videoDeleteSuccess), {
        position: 'bottom-center',
      });
      setShowDeleteConfirmationModal(false);
      history.goBack();
    },
    onError: (err: unknown) => {
      report(err);
      toast.error(intl.formatMessage(messages.videoDeleteError), {
        position: 'bottom-center',
      });
    },
  });

  if (!context.isFromWebsite) {
    return null;
  }

  return (
    <FoldableItem
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue
      title={intl.formatMessage(messages.title)}
    >
      {showDeleteConfirmationModal && (
        <ConfirmationModal
          text={intl.formatMessage(messages.confirmDeleteText)}
          title={intl.formatMessage(messages.confirmDeleteTitle)}
          onModalCloseOrCancel={() => setShowDeleteConfirmationModal(false)}
          onModalConfirm={() => {
            deleteVideo.mutate(video.id);
          }}
          color="action-danger"
        />
      )}
      <StyledAnchorButton
        a11yTitle={intl.formatMessage(messages.deleteButtonText)}
        download
        disabled={!context.permissions.can_update}
        fill="horizontal"
        label={intl.formatMessage(messages.deleteButtonText)}
        target="_blank"
        rel="noopener noreferrer"
        primary
        title={intl.formatMessage(messages.deleteButtonText)}
        onClick={() => setShowDeleteConfirmationModal(true)}
        color="action-danger"
      />
    </FoldableItem>
  );
};
