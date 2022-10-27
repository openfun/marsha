import { Box, Button } from 'grommet';
import { Nullable } from 'lib-common';
import React, { useRef } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { FoldableItem } from 'components/graphicals/FoldableItem';
import { ItemList } from 'components/graphicals/ItemList';
import {
  useUploadManager,
  useSharedLiveMedia,
  modelName,
} from 'lib-components';
import { createSharedLiveMedia } from 'data/sideEffects/createSharedLiveMedia';
import { useCurrentVideo } from 'data/stores/useCurrentRessource/useCurrentVideo';

import { SharedLiveMediaItem } from './SharedLiveMediaItem';

const messages = defineMessages({
  info_teacher: {
    defaultMessage:
      "This widget allows you to manage presentation supports. It makes possible, to upload supports you want to share with students, with options to decide which support are available and which aren't",
    description: 'Info of the widget used for managing and sharing supports.',
    id: 'components.SharedLiveMedia.info_teacher',
  },
  info_public: {
    defaultMessage: 'This widget allows you to download presentation supports.',
    description: 'Info of the widget used for downloading supports.',
    id: 'components.SharedLiveMedia.info_public',
  },
  title: {
    defaultMessage: 'Supports sharing',
    description: 'Title of the widget used for managing and sharing supports.',
    id: 'components.SharedLiveMedia.title',
  },
  uploadButtonLabel: {
    defaultMessage: 'Upload a presentation support',
    description: 'A message indicating the role of the upload button.',
    id: 'components.SharedLiveMedia.uploadButtonLabel',
  },
  noUploadedDocuments: {
    defaultMessage: 'You have no uploaded documents yet.',
    description:
      "A message informing the user he hasn't any document imported yet.",
    id: 'component.SharedLiveMedia.noUploadedDocuments',
  },
  downloadAllLabel: {
    defaultMessage: 'Download all available supports',
    description: 'A message indicating the role of the upload button.',
    id: 'components.SharedLiveMedia.downloadAllLabel',
  },
});

interface SharedMediaProps {
  isLive: boolean;
  isTeacher: boolean;
}

export const SharedLiveMedia = ({ isLive, isTeacher }: SharedMediaProps) => {
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

  const downloadAllMedia = () => {
    sharedLiveMedias.map((media, index) => {
      const target = index === sharedLiveMedias.length - 1 ? '_self' : '_blank';
      const url = media?.urls?.media;
      return (
        media.show_download && url !== undefined && window.open(url, target)
      );
    });
  };

  if (!isTeacher && sharedLiveMedias.length === 0) {
    return null;
  }

  if (
    !isTeacher &&
    sharedLiveMedias.filter((media) => media.show_download).length < 1
  ) {
    return null;
  }

  return (
    <FoldableItem
      infoText={intl.formatMessage(
        isTeacher ? messages.info_teacher : messages.info_public,
      )}
      initialOpenValue
      title={intl.formatMessage(messages.title)}
    >
      <Box direction="column" gap="small">
        {isTeacher && (
          <Box>
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
              style={{ height: '50px', fontFamily: 'Roboto-Medium' }}
              title={intl.formatMessage(messages.uploadButtonLabel)}
            />
          </Box>
        )}

        {!isTeacher &&
          sharedLiveMedias.filter((media) => media.show_download).length >=
            1 && (
            <Button
              a11yTitle={intl.formatMessage(messages.downloadAllLabel)}
              color="blue-active"
              fill="horizontal"
              label={intl.formatMessage(messages.downloadAllLabel)}
              onClick={downloadAllMedia}
              primary
              style={{ height: '50px', fontFamily: 'Roboto-Medium' }}
              title={intl.formatMessage(messages.downloadAllLabel)}
            />
          )}

        <ItemList
          itemList={
            isTeacher
              ? sharedLiveMedias
              : sharedLiveMedias.filter(
                  (media) => media.show_download && media.is_ready_to_show,
                )
          }
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
              isLive={isLive}
              isTeacher={isTeacher}
            />
          )}
        </ItemList>
      </Box>
    </FoldableItem>
  );
};
