import { Box, Button } from 'grommet';
import { Nullable } from 'lib-common';
import {
  useUploadManager,
  useSharedLiveMedia,
  modelName,
  ItemList,
  FoldableItem,
} from 'lib-components';
import React, { useEffect, useRef } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { createSharedLiveMedia } from 'api/createSharedLiveMedia';
import { useCurrentVideo } from 'hooks/useCurrentVideo';

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
  const { sharedLiveMedias, removeResource } = useSharedLiveMedia((state) => ({
    sharedLiveMedias: state.getSharedLiveMedias(),
    removeResource: state.removeResource,
  }));
  const hiddenFileInput = React.useRef<Nullable<HTMLInputElement>>(null);

  //  remove from the store shared live media that have been delete by an other user
  useEffect(() => {
    //  load shared live medias from the store again to prevent having a dependency on it in the useEffect
    //  we can not have a dependency because shared live media during the upload process
    //  will be added in the store even if it is not yet register in the video
    const actualSharedLiveMedias = useSharedLiveMedia
      .getState()
      .getSharedLiveMedias();
    if (actualSharedLiveMedias.length > video.shared_live_medias.length) {
      const ressourcesToRemove = actualSharedLiveMedias.filter(
        (media) =>
          !video.shared_live_medias.find(
            (newMedia) => media.id === newMedia.id,
          ),
      );
      ressourcesToRemove.forEach((ressource) => removeResource(ressource));
    }
  }, [removeResource, video.shared_live_medias]);

  //  handle hidden file input change, IE a file has been selected to upload
  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    let sharedLiveMediaId;
    if (event.target.files && event.target.files[0]) {
      if (!retryUploadIdRef.current) {
        const response = await createSharedLiveMedia({
          video: video.id,
        });
        sharedLiveMediaId = response.id;
      } else {
        sharedLiveMediaId = retryUploadIdRef.current;
        retryUploadIdRef.current = null;
      }

      //  add the file to upload to the uploadManager
      //  the upload manager is reponsible to get the policy to upload the file, upload the file to S3
      //  update the state to the backend
      //  some updates may also be caused by update from the websocket
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
              onChange={(event) => {
                handleChange(event);
              }}
              ref={hiddenFileInput}
              style={{ display: 'none' }}
              type="file"
            />
            <Button
              a11yTitle={intl.formatMessage(messages.uploadButtonLabel)}
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
