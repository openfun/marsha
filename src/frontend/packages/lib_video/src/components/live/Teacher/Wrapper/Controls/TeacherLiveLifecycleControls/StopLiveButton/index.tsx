import { Box, Button, ButtonProps } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { theme } from 'lib-common';
import {
  BoxLoader,
  Heading,
  StopSVG,
  Text,
  Video,
  useVideo,
} from 'lib-components';
import React, { Fragment, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { stopLive } from '@lib-video/api/stopLive';
import { useLiveModaleConfiguration } from '@lib-video/hooks/useLiveModale';

const messages = defineMessages({
  title: {
    defaultMessage: 'End live',
    description: 'Title for the button to end streaming as a teacher.',
    id: 'components.DashboardLiveEndButton.endLive',
  },
  noTitle: {
    defaultMessage: 'No title',
    description: 'Title placeholder when no title is defined for this live',
    id: 'components.DashboardLiveEndButton.noTitle',
  },
  alertInfo: {
    defaultMessage:
      'You are about to stop the live.{br}Every viewers will be disconnected.{br}Are you sure you want to stop this Live ?{br}Beware, live is still running until stopped.',
    description:
      'Message shows when the teacher needs to confirm he wants to stop the live.',
    id: 'components.DashboardLiveEndButton.alertInfo',
  },
  stopButtonTitle: {
    defaultMessage: 'Stop the live',
    description: 'Stop Button title',
    id: 'components.DashboardLiveEndButton.stopButtonTitle',
  },
  error: {
    defaultMessage: 'An error occured, please try again.',
    description:
      'Error message displayed when and error occured when trying to pause',
    id: 'components.DashboardLiveEndButton.error',
  },
  cancel: {
    defaultMessage: 'Cancel',
    description: 'Button label to cancel stopping a live',
    id: 'components.DashboardLiveEndButton.cancel',
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
  const [liveModaleConfiguration, setLiveModaleConfiguration] =
    useLiveModaleConfiguration();
  const [status, setStatus] = useState<EndLiveStatus>({ type: 'idle' });
  const { updateVideo } = useVideo((state) => ({
    updateVideo: state.addResource,
  }));

  useEffect(() => {
    if (status.type === 'error') {
      toast.error(intl.formatMessage(messages.error));
      setStatus({ type: 'idle' });
    }
  }, [status, intl]);

  useEffect(() => {
    if (status.type !== 'loading') {
      return;
    }

    let cancel = false;
    const apiCall = async () => {
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

    apiCall();
    return () => {
      cancel = true;
    };
  }, [status, updateVideo, video]);

  const title = video.title || intl.formatMessage(messages.noTitle);
  const modaleContent = (
    <Fragment>
      <Heading
        aria-label={title}
        level={2}
        truncate
        textAlign="center"
        style={{ width: '100%' }}
      >
        {title}
      </Heading>
      <Text type="p" color="white" textAlign="center" className="mt-0">
        {intl.formatMessage(messages.alertInfo, { br: <br /> })}
      </Text>
    </Fragment>
  );

  return (
    <Button
      primary
      color={normalizeColor('red-active', theme)}
      disabled={!!liveModaleConfiguration || status.type === 'loading'}
      label={
        <Box
          flex
          direction="row"
          style={{ whiteSpace: 'nowrap', color: 'white' }}
        >
          {intl.formatMessage(messages.title)}
          {status.type !== 'loading' && (
            <StopSVG
              iconColor="white"
              height="25px"
              width="25px"
              containerStyle={{ margin: 'auto', marginLeft: '8px' }}
            />
          )}
          {status.type === 'loading' && (
            <BoxLoader
              whiteBackground
              size="small"
              boxProps={{ margin: { left: 'small' } }}
            />
          )}
        </Box>
      }
      onClick={() =>
        setLiveModaleConfiguration({
          content: modaleContent,
          actions: [
            {
              label: intl.formatMessage(messages.stopButtonTitle),
              action: () => {
                setStatus({ type: 'loading' });
                setLiveModaleConfiguration(null);
              },
            },
            {
              label: intl.formatMessage(messages.cancel),
              action: () => {
                setLiveModaleConfiguration(null);
              },
            },
          ],
        })
      }
      {...props}
    />
  );
};
