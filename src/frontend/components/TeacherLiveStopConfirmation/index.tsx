import { Box, Button, Heading, Paragraph, Spinner } from 'grommet';
import React, { Fragment, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { endLive } from 'data/sideEffects/endLive';
import { useStopLiveConfirmation } from 'data/stores/useStopLiveConfirmation';
import { useVideo } from 'data/stores/useVideo';
import { liveState, Video } from 'types/tracks';

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
  stopped: {
    defaultMessage: 'Live is stopped, harvesting will begin soon.',
    description:
      'Message displayed at the end of a live until harvesting began.',
    id: 'components.TeacherLiveStopConfirmation.stopped',
  },
  NoTitle: {
    defaultMessage: 'No title',
    description: 'Title placeholder when no title is defined for this live',
    id: 'components.TeacherLiveStopConfirmation.noTitle',
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

  const title = video.title || intl.formatMessage(messages.NoTitle);

  return (
    <Box fill>
      <Box
        background="#001a29"
        margin="auto"
        pad={{ horizontal: 'large', vertical: 'medium' }}
        round="small"
        style={{ minWidth: '45vw', maxWidth: '600px', width: '50%' }}
      >
        <Heading
          a11yTitle={title}
          color="white"
          level="3"
          margin={{ horizontal: 'auto' }}
          title={title}
          truncate
          textAlign="center"
          style={{ width: '100%' }}
        >
          {title}
        </Heading>

        {video.live_state !== liveState.STOPPED && (
          <Fragment>
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
          </Fragment>
        )}
        {video.live_state === liveState.STOPPED && (
          <Paragraph color="white" textAlign="center">
            {intl.formatMessage(messages.stopped)}
          </Paragraph>
        )}
      </Box>
    </Box>
  );
};
