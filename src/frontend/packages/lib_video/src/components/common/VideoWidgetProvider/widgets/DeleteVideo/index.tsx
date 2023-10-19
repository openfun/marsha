import { Button } from '@openfun/cunningham-react';
import {
  FoldableItem,
  Heading,
  Modal,
  ModalButton,
  ModalControlMethods,
  Text,
  report,
  useCurrentResourceContext,
} from 'lib-components';
import { useRef } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';

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
    defaultMessage: 'Webinar successfully deleted',
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

export const DeleteVideo = () => {
  const intl = useIntl();
  const [context] = useCurrentResourceContext();
  const navigate = useNavigate();
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
      navigate('..');
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
        <Heading level={2} textAlign="center" className="mt-0 mb-s">
          {video.is_live
            ? intl.formatMessage(messages.liveDeleteModalTitle)
            : intl.formatMessage(messages.videoDeleteModalTitle)}
        </Heading>
        <Text className="mt-t">
          {video.is_live
            ? intl.formatMessage(messages.confirmDeleteLiveText)
            : intl.formatMessage(messages.confirmDeleteVideoText)}
        </Text>
        <ModalButton
          aria-label={
            video.is_live
              ? intl.formatMessage(messages.confirmDeleteLiveTitle)
              : intl.formatMessage(messages.confirmDeleteVideoTitle)
          }
          onClickCancel={() => modalActions.current?.close()}
          onClickSubmit={() => deleteVideo.mutate(video.id)}
          color="danger"
        >
          {video.is_live
            ? intl.formatMessage(messages.confirmDeleteLiveTitle)
            : intl.formatMessage(messages.confirmDeleteVideoTitle)}
        </ModalButton>
      </Modal>
      <Button
        disabled={!context.permissions.can_update}
        aria-label={intl.formatMessage(messages.deleteButtonText)}
        fullWidth
        title={intl.formatMessage(messages.deleteButtonText)}
        onClick={() => modalActions.current?.open()}
        color="danger"
      >
        {intl.formatMessage(messages.deleteButtonText)}
      </Button>
    </FoldableItem>
  );
};
