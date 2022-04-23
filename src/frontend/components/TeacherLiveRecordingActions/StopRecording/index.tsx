import { defineMessage } from '@formatjs/intl';
import { Box, Button, Clock, Spinner, Stack } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import React from 'react';
import toast from 'react-hot-toast';
import { useIntl } from 'react-intl';
import styled from 'styled-components';

import { RecordSVG } from 'components/SVGIcons/RecordSVG';
import { useStopLiveRecording } from 'data/queries';
import { Video } from 'types/tracks';
import { theme } from 'utils/theme/theme';

import { formatSecToTimeStamp } from '../utils';

const BlinkedBox = styled(Box)`
  animation: blink-animation 1s ease-in infinite;
  -webkit-animation: blink-animation 1s ease-in infinite;

  @keyframes blink-animation {
    50% {
      opacity: 0;
    }
  }
  @-webkit-keyframes blink-animation {
    50% {
      opacity: 0;
    }
  }
`;

const messages = defineMessage({
  title: {
    defaultMessage: 'REC',
    description: 'Title for the stop recording button',
    id: 'components.StopRecording.title',
  },
  error: {
    defaultMessage: 'An error occured. Please try again later.',
    description:
      'Error displayed when an error is raised when trying to stop recording a live.',
    id: 'components.StopRecording.error',
  },
});

interface StopRecordingProps {
  video: Video;
}

export const StopRecording = ({ video }: StopRecordingProps) => {
  const intl = useIntl();
  const { isLoading, mutate } = useStopLiveRecording(video.id, () => {
    toast.error(intl.formatMessage(messages.error));
  });

  return (
    <Button
      color={normalizeColor('red-active', theme)}
      data-testid="stop-recording"
      disabled={isLoading}
      margin="auto"
      onClick={() => mutate()}
      primary
      label={
        <Stack>
          <Box direction="row" flex style={{ whiteSpace: 'nowrap' }}>
            <BlinkedBox>
              <RecordSVG
                iconColor="white"
                width="25px"
                height="25px"
                containerStyle={{ margin: 'auto', marginRight: '8px' }}
              />
            </BlinkedBox>

            {intl.formatMessage(messages.title)}
            <Clock
              type="digital"
              margin={{ left: 'small' }}
              time={formatSecToTimeStamp(video.recording_time, intl.locale)}
            />
          </Box>
          {isLoading && (
            <Box fill>
              <Spinner
                data-testid="loader-id"
                color="white"
                margin={{ right: 'small' }}
              />
            </Box>
          )}
        </Stack>
      }
      style={{ borderRadius: '25px' }}
    />
  );
};
