import { Box, BoxLoader, BoxProps, Text, liveState } from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { useCurrentVideo } from '@lib-video/hooks/useCurrentVideo';

import { StartLiveButton } from './StartLiveButton';
import { StopLiveButton } from './StopLiveButton';

const messages = defineMessages({
  error: {
    defaultMessage:
      'This should not happen, you need to check a live is ready for the video before using this component.',
    description:
      'Message for the error throw if the component is used for a video that is not a live.',
    id: 'component.TeacherLiveLifecycleControls.error',
  },
  notAnAdministrator: {
    defaultMessage: 'Only a jitsi moderator can administrate the live',
    description:
      'Message displayed to user who is trying to administrate a live but has no right for it.',
    id: 'component.TeacherLiveLifecycleControls.notAnAdministrator',
  },
  joinTheRoom: {
    defaultMessage: 'Join the room before start streaming',
    description:
      'Message displayed to administrator who tries to start a live but has not join jitsi yet',
    id: 'component.TeacherLiveLifecycleControls.joinTheRoom',
  },
  starting: {
    defaultMessage: 'Starting',
    description:
      'Message displayed when the live is currently starting or resuming',
    id: 'component.TeacherLiveLifecycleControls.starting',
  },
  stopping: {
    defaultMessage: 'Stopping',
    description: 'Message displayed when the live is currently stopping',
    id: 'component.TeacherLiveLifecycleControls.stopping',
  },
  harvesting: {
    defaultMessage: 'Harvesting in progress',
    description:
      'Title render in the teacher control bar when live state is harvesting.',
    id: 'component.TeacherLiveLifecycleControls.harvesting',
  },
});

interface TeacherLiveLifecycleControlsProps extends BoxProps<'div'> {
  canStartStreaming: boolean;
  hasRightToStart: boolean;
}

export const TeacherLiveLifecycleControls = ({
  canStartStreaming,
  hasRightToStart,
  ...props
}: TeacherLiveLifecycleControlsProps) => {
  const video = useCurrentVideo();
  const intl = useIntl();

  if (!video.live_state) {
    throw new Error(intl.formatMessage(messages.error));
  }

  const firstItemMargin = { left: 'auto', right: 'none', vertical: 'auto' };
  const firstItemMarginClassname = 'mt-auto mb-auto ml-auto mr-0';
  let content;
  if (!canStartStreaming) {
    content = (
      <Text
        style={{ minWidth: '9.5rem' }}
        textAlign="center"
        className={firstItemMarginClassname}
      >
        {intl.formatMessage(messages.joinTheRoom)}
      </Text>
    );
  } else if (!hasRightToStart) {
    content = (
      <Text
        style={{ minWidth: '11rem' }}
        textAlign="center"
        className={firstItemMarginClassname}
      >
        {intl.formatMessage(messages.notAnAdministrator)}
      </Text>
    );
  } else if (
    [liveState.IDLE, liveState.STOPPED, liveState.HARVESTED].includes(
      video.live_state,
    )
  ) {
    content = (
      <StartLiveButton video={video} className={firstItemMarginClassname} />
    );
  } else if (video.live_state === liveState.STARTING) {
    content = (
      <Box direction="row" margin={firstItemMargin} align="center">
        <Text size="large">{intl.formatMessage(messages.starting)}</Text>
        <BoxLoader boxProps={{ margin: { left: 'small' } }} size="small" />
      </Box>
    );
  } else if (video.live_state === liveState.RUNNING) {
    content = (
      <StopLiveButton video={video} className={firstItemMarginClassname} />
    );
  } else if (video.live_state === liveState.STOPPING) {
    content = (
      <Box direction="row" margin={firstItemMargin} align="center">
        <Text size="large">{intl.formatMessage(messages.stopping)}</Text>
        <BoxLoader boxProps={{ margin: { left: 'small' } }} size="small" />
      </Box>
    );
  } else if (video.live_state === liveState.HARVESTING) {
    content = (
      <Box direction="row" margin={firstItemMargin} align="center">
        <Text style={{ minWidth: '5.5rem' }} textAlign="center">
          {intl.formatMessage(messages.harvesting)}
        </Text>
        <BoxLoader boxProps={{ margin: { left: 'small' } }} size="small" />
      </Box>
    );
  }

  return (
    <Box
      direction="row"
      margin={{ right: 'none', vertical: 'auto' }}
      {...props}
    >
      {content}
    </Box>
  );
};
