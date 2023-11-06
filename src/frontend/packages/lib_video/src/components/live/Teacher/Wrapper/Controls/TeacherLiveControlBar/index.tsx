import { Switch } from '@openfun/cunningham-react';
import { Box, LiveModeType, liveState } from 'lib-components';
import React, { useEffect } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { pollForLive } from '@lib-video/api/pollForLive';
import { useCurrentVideo } from '@lib-video/hooks/useCurrentVideo';
import { useLiveFeedback } from '@lib-video/hooks/useLiveFeedback';
import { useLiveStateStarted } from '@lib-video/hooks/useLiveStateStarted';

const messages = defineMessages({
  label: {
    defaultMessage: 'Live feedback',
    description:
      'Label for the button in actions during a live in raw mode for a teacher to hide his live feedback.',
    id: 'component.LiveFeedbackWrapper.label',
  },
});

export const TeacherLiveControlBar = () => {
  const video = useCurrentVideo();
  const { isStarted, setIsStarted } = useLiveStateStarted((state) => ({
    isStarted: state.isStarted,
    setIsStarted: state.setIsStarted,
  }));
  const intl = useIntl();
  const [isLiveFeedbackVisible, setIsLiveFeedbackVisible] = useLiveFeedback();

  useEffect(() => {
    let canceled = false;
    const poll = async () => {
      if (
        isStarted ||
        video.live_type !== LiveModeType.RAW ||
        !video.urls ||
        !video.live_state ||
        [liveState.IDLE, liveState.STARTING].includes(video.live_state)
      ) {
        return;
      }

      await pollForLive(video.urls);
      if (canceled) {
        return;
      }

      setIsStarted(true);
    };

    poll();
    return () => {
      canceled = true;
    };
  }, [video, isStarted, setIsStarted]);

  if (!(video.live_type === LiveModeType.RAW && isStarted)) {
    return null;
  }

  return (
    <Box direction="row" height="100%">
      <Box height="100%" width={{ min: '60px' }}>
        <Switch
          label={intl.formatMessage(messages.label)}
          checked={isLiveFeedbackVisible}
          aria-checked={isLiveFeedbackVisible}
          onChange={() => setIsLiveFeedbackVisible(!isLiveFeedbackVisible)}
        />
      </Box>
    </Box>
  );
};
