import { defineMessage } from '@formatjs/intl';
import { Box, Button, Clock, Spinner, Stack } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import React from 'react';
import toast from 'react-hot-toast';
import { useIntl } from 'react-intl';

import { RecordSVG } from 'components/SVGIcons/RecordSVG';
import { useStartLiveRecording } from 'data/queries';
import { Video } from 'types/tracks';
import { theme } from 'utils/theme/theme';

import { formatSecToTimeStamp } from '../utils';

const messages = defineMessage({
  title: {
    defaultMessage: 'REC',
    description: 'Title for the start recording button',
    id: 'components.StartRecording.title',
  },
  error: {
    defaultMessage: 'An error occured. Please try again later.',
    description:
      'Error displayed when an error is raised when trying to start recording a live.',
    id: 'components.StartRecording.error',
  },
});

interface StartRecordingProps {
  video: Video;
}

export const StartRecording = ({ video }: StartRecordingProps) => {
  const intl = useIntl();
  const { isLoading, mutate } = useStartLiveRecording(video.id, () => {
    toast.error(intl.formatMessage(messages.error));
  });

  return (
    <Button
      color={normalizeColor('red-active', theme)}
      data-testid="start-recording"
      disabled={isLoading}
      margin="auto"
      onClick={() => mutate()}
      secondary
      label={
        <Stack>
          <Box direction="row" flex style={{ whiteSpace: 'nowrap' }}>
            <RecordSVG
              iconColor="red-active"
              width="25px"
              height="25px"
              containerStyle={{ margin: 'auto', marginRight: '8px' }}
            />
            {intl.formatMessage(messages.title)}
            <Clock
              type="digital"
              margin={{ left: 'small' }}
              run={false}
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
