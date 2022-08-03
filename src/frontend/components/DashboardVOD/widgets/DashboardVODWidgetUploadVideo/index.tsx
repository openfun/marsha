import { Box, Button, Meter, Spinner, Stack, Text } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import React, { useEffect, useRef } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { DashboardLiveWidgetTemplate } from 'components/DashboardLiveControlPane/widgets/DashboardLiveWidgetTemplate';
import { ValidSVG } from 'components/SVGIcons/ValidSVG';
import { useUploadManager } from 'components/UploadManager';
import { useCurrentVideo } from 'data/stores/useCurrentRessource/useCurrentVideo';
import { modelName } from 'types/models';
import { uploadState } from 'types/tracks';
import { theme } from 'utils/theme/theme';
import { Nullable } from 'utils/types';

const messages = defineMessages({
  info: {
    defaultMessage:
      'This widget allows you to upload a video to replace the current one.',
    description: 'Info of the widget used for uploading a new video.',
    id: 'components.DashboardVODWidgetUploadVideo.info',
  },
  title: {
    defaultMessage: 'Video',
    description: 'Title of the widget used for uploading a new video.',
    id: 'components.DashboardVODWidgetUploadVideo.title',
  },
  replaceVideoButtonLabel: {
    defaultMessage: 'Replace the video',
    description: 'Label of the button used for replacing the video.',
    id: 'components.DashboardVODWidgetUploadVideo.replaceVideoButtonLabel',
  },
  videoAvailable: {
    defaultMessage: 'Video available',
    description:
      'A message indicating the video is available and correctly uploaded.',
    id: 'components.DashboardVODWidgetUploadVideo.videoAvailable',
  },
  videoProcessing: {
    defaultMessage:
      'Your video is currently processing. This may take up to an hour. You can close the window and come back later.',
    description: 'Label of the button used for replacing the video.',
    id: 'components.DashboardVODWidgetUploadVideo.videoProcessing',
  },
});

export const DashboardVODWidgetUploadVideo = () => {
  const video = useCurrentVideo();
  const intl = useIntl();
  const { addUpload, resetUpload, uploadManagerState } = useUploadManager();

  const hiddenFileInput = useRef<Nullable<HTMLInputElement>>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      addUpload(modelName.VIDEOS, video.id, event.target.files[0]);
    }
  };

  // When an upload is over and successful, it is deleted from the uploadManagerState, in order
  // to be able to perform a consecutive upload if needed
  useEffect(() => {
    if (
      video.upload_state === uploadState.READY &&
      uploadManagerState[video.id]
    ) {
      resetUpload(video.id);
    }
  }, [video.upload_state]);

  return (
    <DashboardLiveWidgetTemplate
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue
      title={intl.formatMessage(messages.title)}
    >
      <Box direction="column" gap="small">
        {uploadManagerState[video.id] &&
          video.upload_state === uploadState.PENDING && (
            <Box direction="row">
              <Stack anchor="center">
                <Meter
                  round
                  size="xlarge"
                  type="bar"
                  value={uploadManagerState[video.id].progress}
                />
                <Text
                  color={
                    uploadManagerState[video.id].progress < 45
                      ? normalizeColor('blue-active', theme)
                      : 'white'
                  }
                  size="0.725rem"
                >
                  {uploadManagerState[video.id].progress} %
                </Text>
              </Stack>
            </Box>
          )}

        {video.upload_state === uploadState.PROCESSING && (
          <Box
            align="center"
            border={{ color: 'blue-active' }}
            direction="row"
            gap="small"
            pad="small"
            round="xsmall"
          >
            <Spinner />
            <Text alignSelf="center" color="blue-active" size="0.725rem">
              {intl.formatMessage(messages.videoProcessing)}
            </Text>
          </Box>
        )}

        {video.upload_state === uploadState.READY && (
          <Box
            align="center"
            background="bg-select"
            direction="row"
            gap="small"
            height="50px"
            justify="center"
            pad="small"
            round="xsmall"
          >
            <ValidSVG height="20px" iconColor="blue-active" width="20px" />
            <Text color="blue-active" size="1em">
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
          a11yTitle={intl.formatMessage(messages.replaceVideoButtonLabel)}
          color="blue-active"
          fill="horizontal"
          label={intl.formatMessage(messages.replaceVideoButtonLabel)}
          onClick={() =>
            hiddenFileInput.current && hiddenFileInput.current.click()
          }
          primary
          style={{ height: '50px', fontFamily: 'Roboto-Medium' }}
          title={intl.formatMessage(messages.replaceVideoButtonLabel)}
        />
      </Box>
    </DashboardLiveWidgetTemplate>
  );
};
