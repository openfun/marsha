import { Button } from '@openfun/cunningham-react';
import { Nullable, colorsTokens } from 'lib-common';
import {
  Box,
  BoxLoader,
  FoldableItem,
  ProgressionBar,
  Text,
  UploadManagerStatus,
  ValidSVG,
  modelName,
  uploadState,
  useUploadManager,
} from 'lib-components';
import React, { useEffect, useRef } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { uploadEnded } from '@lib-video/api/uploadEnded';
import { useCurrentVideo } from '@lib-video/hooks/useCurrentVideo';

const messages = defineMessages({
  info: {
    defaultMessage:
      'This widget allows you to upload a video to replace the current one.',
    description: 'Info of the widget used for uploading a new video.',
    id: 'components.UploadVideo.info',
  },
  title: {
    defaultMessage: 'Video',
    description: 'Title of the widget used for uploading a new video.',
    id: 'components.UploadVideo.title',
  },
  replaceVideoButtonLabel: {
    defaultMessage: 'Replace the video',
    description: 'Label of the button used for replacing the video.',
    id: 'components.UploadVideo.replaceVideoButtonLabel',
  },
  videoAvailable: {
    defaultMessage: 'Video available',
    description:
      'A message indicating the video is available and correctly uploaded.',
    id: 'components.UploadVideo.videoAvailable',
  },
  videoProcessing: {
    defaultMessage:
      'Your video is currently processing. This may take up to an hour. You can close the window and come back later.',
    description: 'Label of the button used for replacing the video.',
    id: 'components.UploadVideo.videoProcessing',
  },
});

export const UploadVideo = () => {
  const video = useCurrentVideo();

  const intl = useIntl();
  const { addUpload, resetUpload, uploadManagerState } = useUploadManager();
  const hiddenFileInput = useRef<Nullable<HTMLInputElement>>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      addUpload(
        modelName.VIDEOS,
        video.id,
        event.target.files[0],
        undefined,
        (presignedPost) => {
          uploadEnded(video.id, presignedPost.fields['key']);
        },
      );
    }
  };

  // When an upload is over and successful, it is deleted from the uploadManagerState, in order
  // to be able to perform a consecutive upload if needed
  useEffect(() => {
    if (
      video?.upload_state === uploadState.READY &&
      uploadManagerState[video.id]?.status === UploadManagerStatus.SUCCESS
    ) {
      resetUpload(video.id);
    }
  }, [video?.upload_state, resetUpload, video.id, uploadManagerState]);

  useEffect(() => {
    if (video.upload_state !== uploadState.PENDING) {
      return;
    }

    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [video.upload_state]);

  return (
    <FoldableItem
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue
      title={intl.formatMessage(messages.title)}
    >
      <Box gap="small">
        {uploadManagerState[video.id] &&
          video.upload_state === uploadState.PENDING && (
            <ProgressionBar
              progressPercentage={uploadManagerState[video.id].progress}
            />
          )}

        {video.upload_state === uploadState.PROCESSING && (
          <Box
            align="center"
            style={{ border: `1px solid ${colorsTokens['info-500']}` }}
            direction="row"
            gap="small"
            pad="small"
            round="xsmall"
          >
            <BoxLoader size="small" />
            <Text textAlign="center" size="small">
              {intl.formatMessage(messages.videoProcessing)}
            </Text>
          </Box>
        )}

        {video.upload_state === uploadState.READY && (
          <Box
            align="center"
            background={colorsTokens['info-150']}
            direction="row"
            gap="small"
            height="50px"
            justify="center"
            pad="small"
            round="xsmall"
          >
            <ValidSVG
              height="20px"
              iconColor={colorsTokens['info-500']}
              width="20px"
            />
            <Text weight="medium" size="large">
              {intl.formatMessage(messages.videoAvailable)}
            </Text>
          </Box>
        )}

        <input
          accept="video/*"
          data-testid="input-video-test-id"
          onChange={handleChange}
          ref={hiddenFileInput}
          style={{ display: 'none' }}
          type="file"
        />
        <Button
          fullWidth
          aria-label={intl.formatMessage(messages.replaceVideoButtonLabel)}
          onClick={() =>
            hiddenFileInput.current && hiddenFileInput.current.click()
          }
          title={intl.formatMessage(messages.replaceVideoButtonLabel)}
        >
          {intl.formatMessage(messages.replaceVideoButtonLabel)}
        </Button>
      </Box>
    </FoldableItem>
  );
};
