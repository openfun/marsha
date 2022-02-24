import { Box, Button, Heading, Paragraph, Spinner } from 'grommet';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { endLive } from 'data/sideEffects/endLive';
import { useStopLiveConfirmation } from 'data/stores/useStopLiveConfirmation';
import { useVideo } from 'data/stores/useVideo';
import { Video } from 'types/tracks';

const messages = defineMessages({
  alertInfo: {
    defaultMessage:
      'You are about to stop the live.{br}Every viewers will be disconnected.{br}Are you sure you want to stop this Live ?',
    description:
      'Message shows when the teacher needs to confirm he wants to stop the live.',
    id: 'components.TeacherLiveStopConfirmation.alertInfo',
  },
  stopButtonTitle: {
    defaultMessage: 'Stop the live',
    description: 'Stop Button title',
    id: 'components.TeacherLiveStopConfirmation.stopButtonTitle',
  },
  cancelButtonTitle: {
    defaultMessage: 'Cancel',
    description: 'Cancel button title',
    id: 'components.TeacherLiveStopConfirmation.cancelButtonTitle',
  },
  error: {
    defaultMessage: 'An error occured, please try again.',
    description:
      'Error message displayed when and error occured when trying to pause',
    id: 'components.TeacherLiveStopConfirmation.error',
  },
});

type EndLiveStatus =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'error'; error: unknown };

interface TeacherLiveStopConfirmationProps {
  video: Video;
}

export const TeacherLiveStopConfirmation = ({
  video,
}: TeacherLiveStopConfirmationProps) => {
  const intl = useIntl();
  const setShouldShowStopConfirmation = useStopLiveConfirmation()[1];
  const [status, setStatus] = useState<EndLiveStatus>({ type: 'idle' });
  const { updateVideo } = useVideo((state) => ({
    updateVideo: state.addResource,
  }));

  useEffect(() => {
    if (status.type === 'error') {
      toast.error(intl.formatMessage(messages.error));
      setStatus({ type: 'idle' });
    }
  }, [status, intl, messages]);

  useEffect(() => {
    if (status.type !== 'loading') {
      return;
    }

    let cancel = false;
    const apiCall = async () => {
      try {
        const updatedVideo = await endLive(video);
        if (cancel) {
          return;
        }
        setStatus({ type: 'idle' });
        updateVideo(updatedVideo);
      } catch (error) {
        setStatus({ type: 'error', error });
      }
    };

    apiCall();
    return () => {
      cancel = true;
    };
  }, [status, updateVideo]);

  return (
    <Box fill>
      <Box
        background="#001a29"
        margin="auto"
        pad={{ horizontal: 'large', vertical: 'medium' }}
        style={{ width: '50%', maxWidth: '600px', borderRadius: '6px' }}
      >
        <Heading color="white" level="3" textAlign="center">
          {video.title}
        </Heading>
        <Paragraph color="white" textAlign="center">
          {intl.formatMessage(messages.alertInfo, { br: <br /> })}
        </Paragraph>
        <Button
          disabled={status.type === 'loading'}
          justify="center"
          margin={{ vertical: 'small' }}
          onClick={() => setStatus({ type: 'loading' })}
          primary
        >
          <Box>
            <Box direction="row" flex margin="auto">
              {intl.formatMessage(messages.stopButtonTitle)}
              {status.type === 'loading' && (
                <Spinner
                  data-testid="loader-id"
                  color="white"
                  margin={{ left: 'small' }}
                />
              )}
            </Box>
          </Box>
        </Button>
        <Button
          disabled={status.type === 'loading'}
          label={intl.formatMessage(messages.cancelButtonTitle)}
          margin={{ vertical: 'small' }}
          onClick={() => setShouldShowStopConfirmation(false)}
          primary
        />
      </Box>
    </Box>
  );
};
