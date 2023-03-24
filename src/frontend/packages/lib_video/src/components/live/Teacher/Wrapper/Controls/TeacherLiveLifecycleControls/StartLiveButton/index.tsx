import { Box, Button, ButtonProps, Heading, Paragraph, Spinner } from 'grommet';
import { PlaySVG, liveState, Video, useVideo } from 'lib-components';
import React, { Fragment, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { startLive } from '@lib-video/api/startLive';
import { useLiveModaleConfiguration } from '@lib-video/hooks/useLiveModale';

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
  modaleTitle: {
    defaultMessage: 'Start a live',
    description:
      'Modale title rendered when a teacher try to start a live he has already harvest.',
    id: 'components.StartLiveButton.modaleTitle',
  },
  alertInfo: {
    defaultMessage:
      'Beware, you are about to start a live you have already harvested.{br}If you proceed, your previous live record will be lost.{br}Please confirm you want to erase your previous video and start a new live.',
    description:
      'Modale message rendered when a teacher tries to start a live he has already harvested.',
    id: 'components.StartLiveButton.alertInfo',
  },
  cancel: {
    defaultMessage: 'Cancel',
    description:
      'Button label to cancel starting a live when a video is already harvested.',
    id: 'components.StartLiveButton.cancel',
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
  const [liveModaleConfiguration, setLiveModaleConfiguration] =
    useLiveModaleConfiguration();
  const [status, setStatus] = useState<StartLiveStatus>({ type: 'idle' });
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
  }, [status, updateVideo, video]);

  const title = intl.formatMessage(messages.modaleTitle);
  const modaleContent = (
    <Fragment>
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
      <Paragraph color="white" textAlign="center">
        {intl.formatMessage(messages.alertInfo, { br: <br /> })}
      </Paragraph>
    </Fragment>
  );
  const onClick = () => {
    if (video.live_state === liveState.HARVESTED) {
      setLiveModaleConfiguration({
        content: modaleContent,
        actions: [
          {
            label: intl.formatMessage(messages.title),
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
      });
    } else {
      setStatus({ type: 'loading' });
    }
  };

  const isButtonDisabled =
    status.type === 'loading' ||
    video.live_state === liveState.HARVESTING ||
    !!liveModaleConfiguration;

  return (
    <Button
      primary
      disabled={isButtonDisabled}
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
      onClick={onClick}
      {...props}
    />
  );
};
