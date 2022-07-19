import React from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { DashboardVideoLiveConfirmationModal } from 'components/DashboardVideoLiveControlPane/customs/DashboardVideoLiveConfirmationModal';
import { useDeleteSharedLiveMediaUploadModal } from 'data/stores/useDeleteSharedLiveMediaUploadModal';
import { useSharedLiveMedia } from 'data/stores/useSharedLiveMedia';
import { useDeleteSharedLiveMedia } from 'data/queries';
import { report } from 'utils/errors/report';

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
  updateSharedLiveMediaSucces: {
    defaultMessage: 'Shared media updated.',
    description:
      'Message displayed when a shared media is successfully updated.',
    id: 'component.SharedLiveMediaModalWrapper.updateSharedLiveMediaSucces',
  },
  updateSharedLiveMediaFail: {
    defaultMessage: 'Shared media update has failed !',
    description: 'Message displayed when shared media update has failed.',
    id: 'component.SharedLiveMediaModalWrapper.updateSharedLiveMediaFail',
  },
});

export const SharedLiveMediaModalWrapper = () => {
  const intl = useIntl();
  const [
    deleteSharedLiveMediaUploadModal,
    setDeleteSharedLiveMediaUploadModal,
  ] = useDeleteSharedLiveMediaUploadModal();
  const deleteSharedLiveMediaResource = useSharedLiveMedia(
    (state) => state.removeResource,
  );

  const sharedLiveMediaDelete = useDeleteSharedLiveMedia({
    onSuccess: () => {
      toast.success(intl.formatMessage(messages.updateSharedLiveMediaSucces), {
        position: 'bottom-center',
      });
      if (deleteSharedLiveMediaUploadModal) {
        deleteSharedLiveMediaResource(deleteSharedLiveMediaUploadModal);
        setDeleteSharedLiveMediaUploadModal(null);
      }
    },
    onError: (err: unknown) => {
      report(err);
      toast.error(intl.formatMessage(messages.updateSharedLiveMediaFail), {
        position: 'bottom-center',
      });
    },
  });

  if (deleteSharedLiveMediaUploadModal) {
    return (
      <DashboardVideoLiveConfirmationModal
        text={intl.formatMessage(messages.confirmationModalText, {
          sharedLiveMediaName: deleteSharedLiveMediaUploadModal.title,
        })}
        title={intl.formatMessage(messages.confirmationModalTitle)}
        onModalCloseOrCancel={() => setDeleteSharedLiveMediaUploadModal(null)}
        onModalConfirm={() => {
          sharedLiveMediaDelete.mutate(deleteSharedLiveMediaUploadModal.id);
        }}
      />
    );
  }

  return null;
};
