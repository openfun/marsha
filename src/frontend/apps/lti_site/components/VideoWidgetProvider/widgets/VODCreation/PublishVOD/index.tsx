import { defineMessages } from '@formatjs/intl';
import { Box, Paragraph } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { Maybe } from 'lib-common';
import { DownloadSVG, videoSize, useVideo } from 'lib-components';
import React, { useEffect } from 'react';
import { useIntl } from 'react-intl';

import { publishLiveToVod } from 'data/sideEffects/publishLiveToVod';
import { useCurrentVideo } from 'data/stores/useCurrentRessource/useCurrentVideo';
import { theme } from 'utils/theme/theme';
import { useFetchButton } from 'utils/useFetchButton';

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
  }, [state, video]);

  let vodUrl;
  if (video.urls?.mp4) {
    const urlKey = getMax(video.urls.mp4);
    if (urlKey) {
      vodUrl = video.urls.mp4[urlKey];
    }
  }

  return (
    <Box>
      <Paragraph color="blue-active">
        {intl.formatMessage(messages.message)}
      </Paragraph>
      {vodUrl && (
        <Box
          height="40px"
          width="100%"
          background={'#e6f1f8'}
          border={{ color: 'blue-active', size: 'small' }}
          margin={{ bottom: 'small' }}
          round={'xsmall'}
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
                <Paragraph
                  margin={{ left: 'small', vertical: 'auto' }}
                  color="blue-active"
                >
                  {intl.formatMessage(messages.downloadTitle)}
                </Paragraph>
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
