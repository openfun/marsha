import { Button, Heading, Text } from 'grommet';
import {
  ButtonLoaderStyle,
  FoldableItem,
  report,
  useCurrentResourceContext,
  Modal,
  ModalButton,
  ModalControlMethods,
} from 'lib-components';
import { useRef } from 'react';
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
    description: 'Title of the widget used for deleting the resource.',
    id: 'components.DeleteVideo.title',
  },
  confirmDeleteVideoTitle: {
    defaultMessage: 'Confirm delete video',
    description: 'Title of the widget used for confirmation.',
    id: 'components.DeleteVideo.confirmDeleteVideoTitle',
  },
  confirmDeleteLiveTitle: {
    defaultMessage: 'Confirm delete webinar',
    description: 'Title of the widget used for confirmation.',
    id: 'components.DeleteVideo.confirmDeleteLiveTitle',
  },
  confirmDeleteVideoText: {
    defaultMessage:
      'Are you sure you want to delete this video ? This action is irreversible.',
    description: 'Text of the widget used for confirmation.',
    id: 'components.DeleteVideo.confirmDeleteVideoText',
  },
  confirmDeleteLiveText: {
    defaultMessage:
      'Are you sure you want to delete this webinar ? This action is irreversible.',
    description: 'Text of the widget used for confirmation.',
    id: 'components.DeleteVideo.confirmDeleteLiveText',
  },
  deleteButtonText: {
    defaultMessage: 'Delete',
    description: 'Text of the delete button.',
    id: 'components.DeleteVideo.deleteButtonText',
  },
  videoDeleteSuccess: {
    defaultMessage: 'Video successfully deleted',
    description: 'Text of the delete confirmation toast.',
    id: 'components.DeleteVideo.videoDeleteSuccess',
  },
  liveDeleteSuccess: {
    defaultMessage: 'Live successfully deleted',
    description: 'Text of the delete confirmation toast.',
    id: 'components.DeleteVideo.liveDeleteSuccess',
  },
  videoDeleteError: {
    defaultMessage: 'Failed to delete the video',
    description: 'Text of the delete error toast..',
    id: 'components.DeleteVideo.videoDeleteError',
  },
  liveDeleteError: {
    defaultMessage: 'Failed to delete the webinar',
    description: 'Text of the delete error toast..',
    id: 'components.DeleteVideo.liveDeleteError',
  },
  videoDeleteModalTitle: {
    defaultMessage: 'Delete video',
    description: 'Title of the delete modal.',
    id: 'components.DeleteVideoButton.videoDeleteModalTitle',
  },
  liveDeleteModalTitle: {
    defaultMessage: 'Delete webinar',
    description: 'Title of the delete modal.',
    id: 'components.DeleteVideoButton.liveDeleteModalTitle',
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
  const modalActions = useRef<ModalControlMethods>(null);
  const video = useCurrentVideo();
  const deleteVideo = useDeleteVideo({
    onSuccess: () => {
      toast.success(
        video.is_live
          ? intl.formatMessage(messages.liveDeleteSuccess)
          : intl.formatMessage(messages.videoDeleteSuccess),
        {
          position: 'bottom-center',
        },
      );
      history.goBack();
    },
    onError: (err: unknown) => {
      report(err);
      toast.error(
        video.is_live
          ? intl.formatMessage(messages.liveDeleteError)
          : intl.formatMessage(messages.videoDeleteError),
        {
          position: 'bottom-center',
        },
      );
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
      <Modal controlMethods={modalActions}>
        <Heading
          size="3"
          alignSelf="center"
          margin={{ top: '0', bottom: 'small' }}
        >
          {video.is_live
            ? intl.formatMessage(messages.liveDeleteModalTitle)
            : intl.formatMessage(messages.videoDeleteModalTitle)}
        </Heading>
        <Text margin={{ top: 'small' }}>
          {video.is_live
            ? intl.formatMessage(messages.confirmDeleteLiveText)
            : intl.formatMessage(messages.confirmDeleteVideoText)}
        </Text>
        <ModalButton
          label={
            video.is_live
              ? intl.formatMessage(messages.confirmDeleteLiveTitle)
              : intl.formatMessage(messages.confirmDeleteVideoTitle)
          }
          onClickCancel={() => modalActions.current?.close()}
          onClickSubmit={() => deleteVideo.mutate(video.id)}
          style={ButtonLoaderStyle.DESTRUCTIVE}
        />
      </Modal>
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
        onClick={() => modalActions.current?.open()}
        color="action-danger"
      />
    </FoldableItem>
  );
};
