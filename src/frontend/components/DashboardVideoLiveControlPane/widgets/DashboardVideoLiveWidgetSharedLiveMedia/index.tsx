import { Box, Button, Text } from 'grommet';
import React, { useRef } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { DashboardVideoLiveConfirmationModal } from 'components/DashboardVideoLiveControlPane/customs/DashboardVideoLiveConfirmationModal';
import { DashboardVideoLiveWidgetTemplate } from 'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetTemplate';
import { useUploadManager } from 'components/UploadManager';
import { useDeleteSharedLiveMedia } from 'data/queries';
import { createSharedLiveMedia } from 'data/sideEffects/createSharedLiveMedia/index';
import { useCurrentVideo } from 'data/stores/useCurrentRessource/useCurrentVideo';
import { useDeleteUploadModal } from 'data/stores/useDeleteUploadModal';
import { useSharedLiveMedia } from 'data/stores/useSharedLiveMedia/index';
import { modelName } from 'types/models';
import { report } from 'utils/errors/report';
import { Nullable } from 'utils/types';

import { SharedLiveMediaItem } from './SharedLiveMediaItem';

const messages = defineMessages({
  info: {
    defaultMessage:
      "This widget allows you to manage presentation supports. It makes possible, to upload supports you want to share with students, with options to decide which support are available and which aren't",
    description: 'Info of the widget used for managing and sharing supports.',
    id: 'components.DashboardVideoLiveWidgetSharedLiveMedia.info',
  },
  title: {
    defaultMessage: 'Supports sharing',
    description: 'Title of the widget used for managing and sharing supports.',
    id: 'components.DashboardVideoLiveWidgetSharedLiveMedia.title',
  },
  uploadButtonLabel: {
    defaultMessage: 'Upload a presentation support',
    description: 'A message indicating the role of the upload button.',
    id: 'components.DashboardVideoLiveWidgetSharedLiveMedia.uploadButtonLabel',
  },
  noUploadedDocuments: {
    defaultMessage: 'You have no uploaded documents yet.',
    description:
      "A message informing the user he hasn't any document imported yet.",
    id: 'component.DashboardVideoLiveWidgetSharedLiveMedia.noUploadedDocuments',
  },
  confirmationModalTitle: {
    defaultMessage: 'Delete shared media',
    description:
      'Title of the modal displayed when an instructor wants to delete a shared media',
    id: 'component.DashboardVideoLiveWidgetSharedLiveMedia.confirmationModalTitle',
  },
  confirmationModalText: {
    defaultMessage:
      'Are you sure you want to delete file {sharedLiveMediaName} ?',
    description:
      'Title of the modal displayed when an instructor wants to delete a shared media',
    id: 'component.DashboardVideoLiveWidgetSharedLiveMedia.confirmationModalText',
  },
  updateSharedLiveMediaSucces: {
    defaultMessage: 'Shared media updated.',
    description:
      'Message displayed when a shared media is successfully updated.',
    id: 'component.DashboardVideoLiveWidgetSharedLiveMedia.updateSharedLiveMediaSucces',
  },
  updateSharedLiveMediaFail: {
    defaultMessage: 'Shared media update has failed !',
    description: 'Message displayed when shared media update has failed.',
    id: 'component.DashboardVideoLiveWidgetSharedLiveMedia.updateSharedLiveMediaFail',
  },
});

export const DashboardVideoLiveWidgetSharedLiveMedia = () => {
  const video = useCurrentVideo();
  const intl = useIntl();
  const retryUploadIdRef = useRef<Nullable<string>>(null);
  const hiddenFileInput = React.useRef<Nullable<HTMLInputElement>>(null);
  const [deleteUploadModalSharedLiveMedia, setDeleteUploadModal] =
    useDeleteUploadModal();
  const { addUpload, uploadManagerState } = useUploadManager();
  const { sharedLiveMedias } = useSharedLiveMedia((state) => ({
    sharedLiveMedias: state.getSharedLiveMedias(),
  }));
  const deleteSharedLiveMediaResource = useSharedLiveMedia(
    (state) => state.removeResource,
  );

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    let sharedLiveMediaId;
    if (!retryUploadIdRef.current) {
      const response = await createSharedLiveMedia();
      sharedLiveMediaId = response.id;
    } else {
      sharedLiveMediaId = retryUploadIdRef.current;
      retryUploadIdRef.current = null;
    }
    addUpload(
      modelName.SHAREDLIVEMEDIAS,
      sharedLiveMediaId!,
      event.target.files![0],
    );
  };

  const sharedLiveMediaDelete = useDeleteSharedLiveMedia({
    onSuccess: () => {
      toast.success(intl.formatMessage(messages.updateSharedLiveMediaSucces), {
        position: 'bottom-center',
      });
      deleteSharedLiveMediaResource(deleteUploadModalSharedLiveMedia!);
      setDeleteUploadModal(null);
    },
    onError: (err: unknown) => {
      report(err);
      toast.error(intl.formatMessage(messages.updateSharedLiveMediaFail), {
        position: 'bottom-center',
      });
    },
  });

  const onRetryFailedUpload = (sharedLiveMediaId: string) => {
    retryUploadIdRef.current = sharedLiveMediaId;
    hiddenFileInput.current!.click();
  };

  return (
    <DashboardVideoLiveWidgetTemplate
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue
      title={intl.formatMessage(messages.title)}
    >
      {deleteUploadModalSharedLiveMedia && (
        <DashboardVideoLiveConfirmationModal
          text={intl.formatMessage(messages.confirmationModalText, {
            sharedLiveMediaName: deleteUploadModalSharedLiveMedia!.title,
          })}
          title={intl.formatMessage(messages.confirmationModalTitle)}
          onModalCloseOrCancel={() => setDeleteUploadModal(null)}
          onModalConfirm={() => {
            sharedLiveMediaDelete.mutate(deleteUploadModalSharedLiveMedia!.id);
          }}
        />
      )}

      <Box direction="column" gap="small">
        <input
          accept="application/pdf"
          data-testid="input-file-test-id"
          onChange={handleChange}
          ref={hiddenFileInput}
          style={{ display: 'none' }}
          type="file"
        />
        <Button
          a11yTitle={intl.formatMessage(messages.uploadButtonLabel)}
          color="blue-active"
          fill="horizontal"
          label={intl.formatMessage(messages.uploadButtonLabel)}
          onClick={() => {
            retryUploadIdRef.current = null;
            hiddenFileInput.current!.click();
          }}
          primary
          style={{ height: '60px', fontFamily: 'Roboto-Medium' }}
          title={intl.formatMessage(messages.uploadButtonLabel)}
        />

        <Box
          background="bg-select"
          border={{
            color: 'blue-off',
            size: 'small',
          }}
          round="xsmall"
        >
          <Box
            align="center"
            border={{
              color: 'blue-off',
              size: 'small',
              style: 'dashed',
              side: 'between',
            }}
            direction="column"
            gap="small"
            justify="center"
          >
            {sharedLiveMedias.length ? (
              sharedLiveMedias.map((sharedLiveMedia, index) => {
                return (
                  <SharedLiveMediaItem
                    isShared={
                      video.active_shared_live_media &&
                      video.active_shared_live_media.id === sharedLiveMedia.id
                    }
                    key={index}
                    onRetryFailedUpload={onRetryFailedUpload}
                    sharedLiveMedia={sharedLiveMedia}
                    uploadingObject={Object.values(uploadManagerState).find(
                      (uploadingObject) =>
                        uploadingObject.objectId === sharedLiveMedia.id,
                    )}
                  />
                );
              })
            ) : (
              <Text
                color="blue-active"
                margin="small"
                size="0.8rem"
                style={{ fontFamily: 'Roboto-Regular' }}
                truncate
              >
                {intl.formatMessage(messages.noUploadedDocuments)}
              </Text>
            )}
          </Box>
        </Box>
      </Box>
    </DashboardVideoLiveWidgetTemplate>
  );
};
