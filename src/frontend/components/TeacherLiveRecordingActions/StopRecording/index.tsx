import { defineMessage } from '@formatjs/intl';
import { Box, Button, Clock, Spinner } from 'grommet';
import React, { useRef } from 'react';
import toast from 'react-hot-toast';
import { useIntl } from 'react-intl';

import { PauseSVG } from 'components/SVGIcons/PauseSVG';
import { useStopLiveRecording } from 'data/queries';
import { Video } from 'types/tracks';
import { Maybe } from 'utils/types';

const formatDigits = (value: number, locale: string) => {
  return value.toLocaleString(locale, {
    minimumIntegerDigits: 2,
    useGrouping: false,
  });
};

const formatSecToTimeStamp = (duration: Maybe<number>, locale: string) => {
  let recordedTime = 'T00:00:00';
  if (duration) {
    const sec = formatDigits(duration % 60, locale);
    const min = formatDigits(Math.floor(duration / 60) % 60, locale);
    const hour = formatDigits(Math.floor(duration / 3600), locale);

    recordedTime = `T${hour}:${min}:${sec}`;
  }

  return recordedTime;
};

const messages = defineMessage({
  title: {
    defaultMessage: 'Stop recording',
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

interface StopRecordingProps {
  video: Video;
}

export const StopRecording = ({ video }: StopRecordingProps) => {
  const intl = useIntl();
  const buttonRef = useRef(null);
  const { isLoading, mutate } = useStopLiveRecording(video.id, () => {
    toast.error(intl.formatMessage(messages.error));
  });

  return (
    <Button
      disabled={isLoading}
      margin="auto"
      onClick={() => mutate()}
      primary
      ref={buttonRef}
    >
      <Box direction="row" flex style={{ whiteSpace: 'nowrap' }}>
        {isLoading && (
          <Spinner
            data-testid="loader-id"
            color="white"
            margin={{ right: 'small' }}
          />
        )}
        {!isLoading && (
          <PauseSVG
            iconColor="white"
            width="25px"
            height="25px"
            containerStyle={{ margin: 'auto', marginRight: '8px' }}
          />
        )}
        {intl.formatMessage(messages.title)}
        {!isLoading && (
          <Clock
            type="digital"
            margin={{ left: 'small' }}
            time={formatSecToTimeStamp(video.recording_time, intl.locale)}
          />
        )}
      </Box>
    </Button>
  );
};
