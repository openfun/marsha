import { Box, Button, ButtonProps, Spinner } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { StopSVG } from 'components/SVGIcons/StopSVG';
import { endLive } from 'data/sideEffects/endLive';
import { useVideo } from 'data/stores/useVideo';
import { Video } from 'types/tracks';
import { theme } from 'utils/theme/theme';

const messages = defineMessages({
  title: {
    defaultMessage: 'End live',
    description: 'Title for the button to end streaming as a teacher.',
    id: 'components.DashboardVideoLiveEndButton.endLive',
  },
  error: {
    defaultMessage: 'An error occured, please try again.',
    description:
      'Error message displayed when and error occured when trying to pause',
    id: 'components.StopLiveButton.error',
  },
});

type EndLiveStatus =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'error'; error: unknown };

interface StopLiveButtonProps extends ButtonProps {
  video: Video;
}

export const StopLiveButton = ({ video, ...props }: StopLiveButtonProps) => {
  const intl = useIntl();
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

  return (
    <Button
      primary
      color={normalizeColor('red-active', theme)}
      disabled={status.type === 'loading'}
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
            <StopSVG
              iconColor="white"
              height="25px"
              width="25px"
              containerStyle={{ margin: 'auto', marginLeft: '8px' }}
            />
          )}
        </Box>
      }
      onClick={async () => {
        setStatus({ type: 'loading' });
        try {
          const updatedVideo = await endLive(video);
          setStatus({ type: 'idle' });
          updateVideo(updatedVideo);
        } catch (error) {
          setStatus({ type: 'error', error });
        }
      }}
      {...props}
    />
  );
};
