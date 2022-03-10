import { defineMessage } from '@formatjs/intl';
import { Box, BoxProps, Paragraph, Spinner } from 'grommet';
import React, { Fragment } from 'react';
import { useIntl } from 'react-intl';

import { liveState, Video } from 'types/tracks';

import { PauseLiveButton } from './PauseLiveButton';
import { ResumeLiveButton } from './ResumeLiveButton';
import { StartLiveButton } from './StartLiveButton';
import { StopLiveButton } from './StopLiveButton';

const messages = defineMessage({
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
  pausing: {
    defaultMessage: 'Pausing',
    description: 'Message displayed when the live is currently pausing',
    id: 'component.TeacherLiveLifecycleControls.pausing',
  },
});

interface TeacherLiveLifecycleControlsProps extends BoxProps {
  canStartStreaming: boolean;
  hasRightToStart: boolean;
  video: Video;
}

export const TeacherLiveLifecycleControls = ({
  canStartStreaming,
  hasRightToStart,
  video,
  ...props
}: TeacherLiveLifecycleControlsProps) => {
  const intl = useIntl();

  if (!video.live_state) {
    throw new Error(intl.formatMessage(messages.error));
  }

  const firstItemMargin = { left: 'auto', right: 'none', vertical: 'auto' };
  let content;
  if (!canStartStreaming) {
    content = (
      <Paragraph margin={firstItemMargin}>
        {intl.formatMessage(messages.joinTheRoom)}
      </Paragraph>
    );
  } else if (!hasRightToStart) {
    content = (
      <Paragraph margin={firstItemMargin}>
        {intl.formatMessage(messages.notAnAdministrator)}
      </Paragraph>
    );
  } else if (video.live_state === liveState.IDLE) {
    content = <StartLiveButton video={video} margin={firstItemMargin} />;
  } else if (video.live_state === liveState.STARTING) {
    content = (
      <Box direction="row" flex="shrink" margin={firstItemMargin}>
        <Paragraph margin="auto">
          {intl.formatMessage(messages.starting)}
        </Paragraph>
        <Spinner margin={{ left: 'small' }} />
      </Box>
    );
  } else if (video.live_state === liveState.RUNNING) {
    content = <PauseLiveButton video={video} margin={firstItemMargin} />;
  } else if (video.live_state === liveState.PAUSED) {
    content = (
      <Fragment>
        <StopLiveButton video={video} margin={firstItemMargin} />
        <ResumeLiveButton video={video} margin={{ left: 'small' }} />
      </Fragment>
    );
  } else if (video.live_state === liveState.STOPPING) {
    content = (
      <Box direction="row" flex="shrink" margin={firstItemMargin}>
        <Paragraph margin="auto">
          {intl.formatMessage(messages.pausing)}
        </Paragraph>
        <Spinner margin={{ left: 'small' }} />
      </Box>
    );
  }

  return (
    <Box direction="row" {...props}>
      {content}
    </Box>
  );
};
