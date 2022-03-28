import { Box, Button, ButtonProps, Spinner } from 'grommet';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { PlaySVG } from 'components/SVGIcons/PlaySVG';
import { startLive } from 'data/sideEffects/startLive';
import { useVideo } from 'data/stores/useVideo';
import { Video } from 'types/tracks';

const messages = defineMessages({
  title: {
    defaultMessage: 'Start streaming',
    description: 'Title for the button to start streaming as a teacher.',
    id: 'components.StartLiveButton.title',
  },
  error: {
    defaultMessage: 'An error occured, please try again.',
    description:
      'Error message displayed when and error occured when trying to pause',
    id: 'components.StartLiveButton.error',
  },
});

type StartLiveStatus =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'error'; error: unknown };

interface StartLiveButtonProps extends ButtonProps {
  video: Video;
}

export const StartLiveButton = ({ video, ...props }: StartLiveButtonProps) => {
  const intl = useIntl();
  const [status, setStatus] = useState<StartLiveStatus>({ type: 'idle' });
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
        const updatedVideo = await startLive(video);

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
    <Button
      primary
      disabled={status.type === 'loading'}
      label={
        <Box flex direction="row" style={{ whiteSpace: 'nowrap' }}>
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
              width="25px"
              height="25px"
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
