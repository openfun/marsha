import { Box, Button, ButtonProps, Spinner } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { PauseSVG } from 'components/SVGIcons/PauseSVG';
import { stopLive } from 'data/sideEffects/stopLive';
import { useVideo } from 'data/stores/useVideo';
import { Video } from 'types/tracks';
import { theme } from 'utils/theme/theme';

const messages = defineMessages({
  title: {
    defaultMessage: 'Pause live',
    description: 'Title for the button to pause streaming as a teacher',
    id: 'components.PauseLiveButton.endLive',
  },
  error: {
    defaultMessage: 'An error occured, please try again.',
    description:
      'Error message displayed when and error occured when trying to pause',
    id: 'components.PauseLiveButton.error',
  },
});

type PauseLiveStatus =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'error'; error: unknown };

interface PauseLiveButtonProps extends ButtonProps {
  video: Video;
}

export const PauseLiveButton = ({ video, ...props }: PauseLiveButtonProps) => {
  const intl = useIntl();
  const [status, setStatus] = useState<PauseLiveStatus>({ type: 'idle' });
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
    const callApi = async () => {
      try {
        const updatedVideo = await stopLive(video);
        if (cancel) {
          return;
        }
        setStatus({ type: 'idle' });
        updateVideo(updatedVideo);
      } catch (error) {
        setStatus({ type: 'error', error });
      }
    };

    callApi();
    return () => {
      cancel = true;
    };
  }, [status, updateVideo]);

  return (
    <Button
      primary
      color={normalizeColor('red-active', theme)}
      disabled={status.type !== 'idle'}
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
            <PauseSVG
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
