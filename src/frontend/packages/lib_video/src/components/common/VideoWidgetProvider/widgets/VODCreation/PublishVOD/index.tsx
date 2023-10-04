import { defineMessages } from '@formatjs/intl';
import { Box } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { Maybe, theme } from 'lib-common';
import {
  DownloadSVG,
  Text,
  useFetchButton,
  useVideo,
  videoSize,
} from 'lib-components';
import React, { useEffect } from 'react';
import { useIntl } from 'react-intl';

import { publishLiveToVod } from '@lib-video/api/publishLiveToVod';
import { useCurrentVideo } from '@lib-video/hooks/useCurrentVideo';

const messages = defineMessages({
  buttonLabel: {
    defaultMessage: 'Convert into VOD',
    description: 'Button label to publish a live VOD.',
    id: 'components.PublishVOD.buttonLabel',
  },
  message: {
    defaultMessage:
      'Your live has been harvested, you can convert into VOD for students to watch it.',
    description: 'Message displayed to teacher when live has been harvested.',
    id: 'components.PublishVOD.message',
  },
  downloadTitle: {
    defaultMessage: 'Download the video',
    description: 'Button title to download the harvested video',
    id: 'components.PublishVOD.downloadTitle',
  },
});

function getMax(obj: object): Maybe<videoSize> {
  return Math.max.apply(
    null,
    Object.keys(obj).map((size) => Number(size)),
  ) as videoSize;
}

export const PublishVOD = () => {
  const video = useCurrentVideo();
  const intl = useIntl();
  const [state, setState, FetchButton] = useFetchButton();
  const { updateVideo } = useVideo((storeState) => ({
    updateVideo: storeState.addResource,
  }));

  useEffect(() => {
    if (state.type !== 'loading') {
      return;
    }

    let cancel = false;
    const apiCall = async () => {
      try {
        const updatedVideo = await publishLiveToVod(video);
        if (cancel) {
          return;
        }
        setState({ type: 'idle' });
        updateVideo(updatedVideo);
      } catch (error) {
        setState({ type: 'error', error });
      }
    };

    apiCall();
    return () => {
      cancel = true;
    };
  }, [state, video, setState, updateVideo]);

  let vodUrl;
  if (video.urls?.mp4) {
    const urlKey = getMax(video.urls.mp4);
    if (urlKey) {
      vodUrl = video.urls.mp4[urlKey];
    }
  }

  return (
    <Box>
      <Text type="p" className="mt-0">
        {intl.formatMessage(messages.message)}
      </Text>
      {vodUrl && (
        <Box
          height="40px"
          width="100%"
          background="#e6f1f8"
          border={{ color: 'blue-active', size: 'small' }}
          margin={{ bottom: 'small' }}
          round="xsmall"
        >
          <a
            href={vodUrl}
            download
            style={{
              width: '100%',
              height: '100%',
              textDecoration: 'none',
            }}
          >
            <Box height="100%" width="100%">
              <Box
                align="center"
                justify="center"
                direction="row"
                margin="auto"
              >
                <DownloadSVG
                  iconColor={normalizeColor('blue-active', theme)}
                  height="20px"
                />
                <Text className="ml-t">
                  {intl.formatMessage(messages.downloadTitle)}
                </Text>
              </Box>
            </Box>
          </a>
        </Box>
      )}
      <FetchButton
        label={intl.formatMessage(messages.buttonLabel)}
        style={{ width: '100%' }}
      />
    </Box>
  );
};
