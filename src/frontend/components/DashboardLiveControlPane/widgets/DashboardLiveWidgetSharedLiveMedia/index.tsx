import { Box, Button } from 'grommet';
import React, { useRef } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { DashboardLiveItemList } from 'components/DashboardLiveControlPane/customs/DashboardLiveItemList';
import { DashboardLiveWidgetTemplate } from 'components/DashboardLiveControlPane/widgets/DashboardLiveWidgetTemplate';
import { useUploadManager } from 'components/UploadManager';
import { createSharedLiveMedia } from 'data/sideEffects/createSharedLiveMedia';
import { useCurrentVideo } from 'data/stores/useCurrentRessource/useCurrentVideo';
import { useSharedLiveMedia } from 'data/stores/useSharedLiveMedia';
import { modelName } from 'types/models';
import { Nullable } from 'utils/types';

import { SharedLiveMediaItem } from './SharedLiveMediaItem';

const messages = defineMessages({
  info: {
    defaultMessage:
      "This widget allows you to manage presentation supports. It makes possible, to upload supports you want to share with students, with options to decide which support are available and which aren't",
    description: 'Info of the widget used for managing and sharing supports.',
    id: 'components.DashboardLiveWidgetSharedLiveMedia.info',
  },
  title: {
    defaultMessage: 'Supports sharing',
    description: 'Title of the widget used for managing and sharing supports.',
    id: 'components.DashboardLiveWidgetSharedLiveMedia.title',
  },
  uploadButtonLabel: {
    defaultMessage: 'Upload a presentation support',
    description: 'A message indicating the role of the upload button.',
    id: 'components.DashboardLiveWidgetSharedLiveMedia.uploadButtonLabel',
  },
  noUploadedDocuments: {
    defaultMessage: 'You have no uploaded documents yet.',
    description:
      "A message informing the user he hasn't any document imported yet.",
    id: 'component.DashboardLiveWidgetSharedLiveMedia.noUploadedDocuments',
  },
});

export const DashboardLiveWidgetSharedLiveMedia = () => {
  const video = useCurrentVideo();
  const intl = useIntl();
  const retryUploadIdRef = useRef<Nullable<string>>(null);
  const { addUpload, uploadManagerState } = useUploadManager();
  const { sharedLiveMedias } = useSharedLiveMedia((state) => ({
    sharedLiveMedias: state.getSharedLiveMedias(),
  }));
  const hiddenFileInput = React.useRef<Nullable<HTMLInputElement>>(null);

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    let sharedLiveMediaId;
    if (event.target.files && event.target.files[0]) {
      if (!retryUploadIdRef.current) {
        const response = await createSharedLiveMedia();
        sharedLiveMediaId = response.id;
      } else {
        sharedLiveMediaId = retryUploadIdRef.current;
        retryUploadIdRef.current = null;
      }
      addUpload(
        modelName.SHAREDLIVEMEDIAS,
        sharedLiveMediaId,
        event.target.files[0],
      );
    }
  };

  const onRetryFailedUpload = (sharedLiveMediaId: string) => {
    if (hiddenFileInput.current) {
      retryUploadIdRef.current = sharedLiveMediaId;
      hiddenFileInput.current.click();
    }
  };

  return (
    <DashboardLiveWidgetTemplate
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue
      title={intl.formatMessage(messages.title)}
    >
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
            if (hiddenFileInput.current) {
              retryUploadIdRef.current = null;
              hiddenFileInput.current.click();
            }
          }}
          primary
          style={{ height: '60px', fontFamily: 'Roboto-Medium' }}
          title={intl.formatMessage(messages.uploadButtonLabel)}
        />

        <DashboardLiveItemList
          itemList={sharedLiveMedias}
          noItemsMessage={intl.formatMessage(messages.noUploadedDocuments)}
        >
          {(sharedLiveMedia, index) => (
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
          )}
        </DashboardLiveItemList>
      </Box>
    </DashboardLiveWidgetTemplate>
  );
};
