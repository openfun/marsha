import { ConfirmationModal, report, useSharedLiveMedia } from 'lib-components';
import React from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { useDeleteSharedLiveMedia } from '@lib-video/api/useDeleteSharedLiveMedia';
import { useDeleteSharedLiveMediaModal } from '@lib-video/hooks/useDeleteSharedLiveMediaModal';

const messages = defineMessages({
  confirmationModalTitle: {
    defaultMessage: 'Delete shared media',
    description:
      'Title of the modal displayed when an instructor wants to delete a shared media',
    id: 'component.SharedLiveMediaModalWrapper.confirmationModalTitle',
  },
  confirmationModalText: {
    defaultMessage:
      'Are you sure you want to delete file {sharedLiveMediaName} ?',
    description:
      'Title of the modal displayed when an instructor wants to delete a shared media',
    id: 'component.SharedLiveMediaModalWrapper.confirmationModalText',
  },
  deletionSharedLiveMediaSucces: {
    defaultMessage: 'Shared media deleted.',
    description:
      'Message displayed when a shared media is successfully updated.',
    id: 'component.SharedLiveMediaModalWrapper.deletionSharedLiveMediaSucces',
  },
  deletionSharedLiveMediaFail: {
    defaultMessage: 'Shared media deletion has failed !',
    description: 'Message displayed when shared media update has failed.',
    id: 'component.SharedLiveMediaModalWrapper.deletionSharedLiveMediaFail',
  },
});

export const SharedLiveMediaModalWrapper = () => {
  const intl = useIntl();
  const [deleteSharedLiveMediaModal, setDeleteSharedLiveMediaModal] =
    useDeleteSharedLiveMediaModal();
  const deleteSharedLiveMediaResource = useSharedLiveMedia(
    (state) => state.removeResource,
  );

  const sharedLiveMediaDelete = useDeleteSharedLiveMedia({
    onSuccess: () => {
      toast.success(
        intl.formatMessage(messages.deletionSharedLiveMediaSucces),
        {
          position: 'bottom-center',
        },
      );
      if (deleteSharedLiveMediaModal) {
        deleteSharedLiveMediaResource(deleteSharedLiveMediaModal);
        setDeleteSharedLiveMediaModal(null);
      }
    },
    onError: (err: unknown) => {
      report(err);
      toast.error(intl.formatMessage(messages.deletionSharedLiveMediaFail), {
        position: 'bottom-center',
      });
    },
  });

  if (deleteSharedLiveMediaModal) {
    return (
      <ConfirmationModal
        text={intl.formatMessage(messages.confirmationModalText, {
          sharedLiveMediaName: deleteSharedLiveMediaModal.title,
        })}
        title={intl.formatMessage(messages.confirmationModalTitle)}
        onModalCloseOrCancel={() => setDeleteSharedLiveMediaModal(null)}
        onModalConfirm={() => {
          sharedLiveMediaDelete.mutate({
            videoId: deleteSharedLiveMediaModal.video,
            sharedLiveMediaId: deleteSharedLiveMediaModal.id,
          });
        }}
      />
    );
  }

  return null;
};
