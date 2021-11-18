import { Box, Clock, Layer, Paragraph } from 'grommet';
import { DateTime, DurationObjectUnits } from 'luxon';
import React, { useMemo, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import videojs from 'video.js';

import { H2 } from 'components/Headings';
import { getResource } from 'data/sideEffects/getResource';
import { Video } from 'types/tracks';
import { modelName } from 'types/models';
import { useAsyncEffect } from 'utils/useAsyncEffect';
import { resumeLive } from 'utils/resumeLive';

const messages = defineMessages({
  pausedSince: {
    defaultMessage: 'The webinar is paused since ',
    description:
      'Information about the time since which the webinar is paused.',
    id: 'components.PublicPausedLive.pausedSince',
  },
  pausedDays: {
    defaultMessage: '{pausedDays} {pausedDays, plural, one {day} other {days}}',
  },
  title: {
    defaultMessage: 'Webinar is paused',
    description: 'Title for the public paused live component',
    id: 'components.PublicPausedLive.title',
  },
  text: {
    defaultMessage:
      'The webinar is paused. When resumed, the video will start again.',
    description: 'Message for the public when live is paused',
    id: 'components.PublicPausedLive.message',
  },
});

interface PublicPausedLiveVideoProps {
  video: Video;
  videoNodeRef: HTMLVideoElement;
}

export const PublicPausedLiveVideo = ({
  video,
  videoNodeRef,
}: PublicPausedLiveVideoProps) => {
  const diffSincePause = useMemo<DurationObjectUnits | null>(() => {
    if (video.live_info.paused_at === undefined) {
      return null;
    }

    const now = DateTime.now();
    const pausedAt = DateTime.fromSeconds(Number(video.live_info.paused_at));
    return now
      .diff(pausedAt, ['days', 'hours', 'minutes', 'seconds'])
      .toObject();
  }, []);
  const time = useMemo<string | undefined>(() => {
    if (!diffSincePause) {
      return undefined;
    }

    return `PT${diffSincePause.hours}H${diffSincePause.minutes}M${diffSincePause.seconds}S`;
  }, [diffSincePause]);
  const [days, setDays] = useState(diffSincePause?.days ?? 0);

  useAsyncEffect(async () => {
    try {
      await resumeLive(video);
    } catch (error) {
      await getResource(modelName.VIDEOS, video.id);
    }

    const player = Object.values(videojs.getPlayers())[0];
    player.src(player.currentSource());
  }, []);

  const onChangeClock = (timer: string) => {
    if (timer === 'P0H0M0S') {
      setDays(days + 1);
    }
  };

  return (
    <Layer background={{ opacity: true }} modal={true} target={videoNodeRef}>
      <Box gap="medium" align="center" justify="center" pad="large">
        {time && (
          <Box
            background="light-2"
            direction="column"
            align="center"
            pad="medium"
            round
          >
            <FormattedMessage {...messages.pausedSince} />{' '}
            {days > 0 && (
              <React.Fragment>
                <FormattedMessage
                  {...messages.pausedDays}
                  values={{ pausedDays: days }}
                />
                {' + '}
              </React.Fragment>
            )}
            <Clock type="digital" time={time} onChange={onChangeClock} />
          </Box>
        )}
        <Box
          background="light-2"
          direction="column"
          align="center"
          justify="center"
          pad="medium"
          gap="small"
          round
        >
          <H2>
            <FormattedMessage {...messages.title} />
          </H2>
          <Paragraph>
            <FormattedMessage {...messages.text} />
          </Paragraph>
        </Box>
      </Box>
    </Layer>
  );
};
