import { Box, Button, ButtonProps, Spinner } from 'grommet';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { PlaySVG } from 'components/SVGIcons/PlaySVG';
import { startLive } from 'data/sideEffects/startLive';
import { useStopLiveConfirmation } from 'data/stores/useStopLiveConfirmation';
import { useVideo } from 'data/stores/useVideo';
import { Video } from 'types/tracks';

const messages = defineMessages({
  title: {
    defaultMessage: 'Resume streaming',
    description: 'Title for the button to resume streaming as a teacher.',
    id: 'components.ResumeLiveButton.title',
  },
  error: {
    defaultMessage: 'An error occured, please try again.',
    description:
      'Error message displayed when and error occured when trying to pause',
    id: 'components.ResumeLiveButton.error',
  },
});

type ResumeLiveStatus =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'error'; error: unknown };

interface ResumeLiveButtonProps extends ButtonProps {
  video: Video;
}

export const ResumeLiveButton = ({
  video,
  ...props
}: ResumeLiveButtonProps) => {
  const intl = useIntl();
  const setShowStopConfirmation = useStopLiveConfirmation()[1];
  const [status, setStatus] = useState<ResumeLiveStatus>({ type: 'idle' });
  const { updateVideo } = useVideo((state) => ({
    updateVideo: state.addResource,
  }));
  const [shouldShowStopAler] = useStopLiveConfirmation();

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
        const updatedVideo = await startLive(video);
        if (cancel) {
          return;
        }
        setShowStopConfirmation(false);
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
    <Button
      primary
      disabled={shouldShowStopAler || status.type === 'loading'}
      label={
        <Box flex direction="row">
          {intl.formatMessage(messages.title)}
          {status.type === 'loading' && (
            <Spinner
              data-testid="loader-id"
              color="white"
              margin={{ left: 'small' }}
            />
          )}
          {status.type !== 'loading' && (
            <PlaySVG
              iconColor="white"
              height="25px"
              width="25px"
              containerStyle={{ margin: 'auto', marginLeft: '8px' }}
            />
          )}
        </Box>
      }
      onClick={() => setStatus({ type: 'loading' })}
      {...props}
    />
  );
};
