import { ConfirmationModal, report, useTimedTextTrack } from 'lib-components';
import React from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { useDeleteTimedTextTrack } from '@lib-video/api/useDeleteTimedTextTrack';
import { useDeleteTimedTextTrackUploadModal } from '@lib-video/hooks/useDeleteTimedTextTrackUploadModal';

const messages = defineMessages({
  confirmationModalTitle: {
    defaultMessage: 'Delete timed text track',
    description:
      'Title of the modal displayed when an instructor wants to delete a timed text track',
    id: 'component.TimedTrackModalWrapper.confirmationModalTitle',
  },
  confirmationModalText: {
    defaultMessage:
      'Are you sure you want to delete file {timedTextTrackName} ?',
    description:
      'Confirmation message of the modal displayed when an instructor wants to delete a timed text track',
    id: 'component.TimedTrackModalWrapper.confirmationModalText',
  },
  updateTimedTextTrackSucces: {
    defaultMessage: 'Timed text track updated.',
    description:
      'Message displayed when a timed text track is successfully updated.',
    id: 'component.TimedTrackModalWrapper.updateTimedTextTrackSucces',
  },
  updateTimedTextTrackFail: {
    defaultMessage: 'Timed text track update has failed !',
    description: 'Message displayed when timed text track update has failed.',
    id: 'component.TimedTrackModalWrapper.updateTimedTextTrackFail',
  },
});

export const TimedTrackModalWrapper = () => {
  const intl = useIntl();
  const deleteTimedTextTrackResource = useTimedTextTrack(
    (state) => state.removeResource,
  );
  const [deleteTimedTextTrackUploadModal, setDeleteTimedTextTrackUploadModal] =
    useDeleteTimedTextTrackUploadModal();

  const timedTextTrackDelete = useDeleteTimedTextTrack({
    onSuccess: () => {
      toast.success(intl.formatMessage(messages.updateTimedTextTrackSucces), {
        position: 'bottom-center',
      });
      if (deleteTimedTextTrackUploadModal) {
        deleteTimedTextTrackResource(deleteTimedTextTrackUploadModal);
        setDeleteTimedTextTrackUploadModal(null);
      }
    },
    onError: (err: unknown) => {
      report(err);
      toast.error(intl.formatMessage(messages.updateTimedTextTrackFail), {
        position: 'bottom-center',
      });
    },
  });

  if (deleteTimedTextTrackUploadModal) {
    return (
      <ConfirmationModal
        text={intl.formatMessage(messages.confirmationModalText, {
          timedTextTrackName: deleteTimedTextTrackUploadModal.title,
        })}
        title={intl.formatMessage(messages.confirmationModalTitle)}
        onModalConfirm={() => {
          timedTextTrackDelete.mutate({
            videoId: deleteTimedTextTrackUploadModal.video,
            timedTextTrackId: deleteTimedTextTrackUploadModal.id,
          });
        }}
        onModalCloseOrCancel={() => setDeleteTimedTextTrackUploadModal(null)}
      />
    );
  }

  return null;
};
