import { defineMessage } from '@formatjs/intl';
import { Box, Button, Spinner } from 'grommet';
import React, { useRef } from 'react';
import toast from 'react-hot-toast';
import { useIntl } from 'react-intl';

import { RecordSVG } from 'components/SVGIcons/RecordSVG';
import { useStartLiveRecording } from 'data/queries';
import { Video } from 'types/tracks';

const messages = defineMessage({
  title: {
    defaultMessage: 'Start recording',
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
  const buttonRef = useRef(null);
  const { isLoading, mutate } = useStartLiveRecording(video.id, () => {
    toast.error(intl.formatMessage(messages.error));
  });

  return (
    <Button
      disabled={isLoading}
      margin="auto"
      onClick={() => mutate()}
      primary
      ref={buttonRef}
    >
      <Box direction="row" flex style={{ whiteSpace: 'nowrap' }}>
        {isLoading && (
          <Spinner
            data-testid="loader-id"
            color="white"
            margin={{ right: 'small' }}
          />
        )}
        {!isLoading && (
          <RecordSVG
            iconColor="white"
            width="25px"
            height="25px"
            containerStyle={{ margin: 'auto', marginRight: '8px' }}
          />
        )}
        {intl.formatMessage(messages.title)}
      </Box>
    </Button>
  );
};
