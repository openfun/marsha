import { Button } from '@openfun/cunningham-react';
import { Clock } from 'grommet';
import { Box, BoxLoader, RecordSVG } from 'lib-components';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { useStopLiveRecording } from '@lib-video/api/useStopLiveRecording';
import { useVideoMetadata } from '@lib-video/api/useVideoMetadata';
import { formatSecToTimeStamp } from '@lib-video/components/live/Teacher/Wrapper/Controls/TeacherLiveRecordingActions/utils';
import { useCurrentVideo } from '@lib-video/hooks/useCurrentVideo';

const BlinkedBox = styled(Box)`
  animation: blink-animation 1s ease-in infinite;
  -webkit-animation: blink-animation 1s ease-in infinite;

  @keyframes blink-animation {
    50% {
      opacity: 0;
    }
  }
  @-webkit-keyframes blink-animation {
    50% {
      opacity: 0;
    }
  }
`;

const messages = defineMessages({
  title: {
    defaultMessage: 'REC',
    description: 'Title for the stop recording button',
    id: 'components.StopRecording.title',
  },
  error: {
    defaultMessage: 'An error occured. Please try again later.',
    description:
      'Error displayed when an error is raised when trying to stop recording a live.',
    id: 'components.StopRecording.error',
  },
});

export const StopRecording = () => {
  const intl = useIntl();
  const [recordingActionEnabled, setRecordingActionEnabled] = useState(false);
  const video = useCurrentVideo();
  const { data } = useVideoMetadata(intl.locale);

  useEffect(() => {
    if (
      data?.live.segment_duration_seconds &&
      data.live.segment_duration_seconds > 0
    ) {
      const timeoutId = window.setTimeout(
        () => {
          setRecordingActionEnabled(true);
        },
        data?.live.segment_duration_seconds * 1000,
      );

      return () => {
        window.clearTimeout(timeoutId);
      };
    }

    return;
  }, [data?.live.segment_duration_seconds]);

  const { isLoading, mutate } = useStopLiveRecording(video.id, () => {
    toast.error(intl.formatMessage(messages.error));
  });

  return (
    <Button
      color="danger"
      data-testid="stop-recording"
      disabled={isLoading || !recordingActionEnabled}
      onClick={() => mutate()}
      className="m-auto pl-s pr-s"
      style={{ borderRadius: '25px', whiteSpace: 'nowrap' }}
      icon={
        isLoading ? (
          <BoxLoader size="small" boxProps={{ margin: { right: 'small' } }} />
        ) : (
          <BlinkedBox>
            <RecordSVG
              iconColor="white"
              width="25px"
              height="25px"
              containerStyle={{ margin: 'auto', marginRight: '8px' }}
            />
          </BlinkedBox>
        )
      }
    >
      {intl.formatMessage(messages.title)}
      <Clock
        type="digital"
        margin={{ left: 'small' }}
        time={formatSecToTimeStamp(video.recording_time, intl.locale)}
      />
    </Button>
  );
};
