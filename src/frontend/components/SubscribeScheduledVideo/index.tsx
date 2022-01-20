import {
  Box,
  Clock,
  Heading,
  Notification,
  Paragraph,
  StatusType,
} from 'grommet';
import { DateTime } from 'luxon';
import React, { useState, useRef } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { SubscribeScheduledVideoEmailForm } from 'components/SubscribeScheduledVideoEmailForm';
import { WaitingLiveVideo } from 'components/WaitingLiveVideo';
import { getDecodedJwt } from 'data/appData';
import { fetchList } from 'data/queries/fetchList';
import { intl as mainIntl } from 'index';
import { Video } from 'types/tracks';
import { useAsyncEffect } from 'utils/useAsyncEffect';
import { Nullable } from 'utils/types';

/** Props shape for the SubscribeScheduledVideo component. */
interface SubscribeScheduledVideoProps {
  video: Video;
}
const timeIsOver = 'P0H0M0S';
const durationFullDay = 'PT23H59M59S';

const messages = defineMessages({
  daysLeft: {
    defaultMessage:
      'Days left {daysLeft,number} {daysLeft, plural, =0 {day} one {day} other {days}}',
    description:
      'Text message to inform on number of days left before the event starts',
    id: 'components.SubscribScheduledVideo.daysLeft',
  },
  register: {
    defaultMessage: 'Register to this event starting on {date}',
    description: 'Title message to register to this event',
    id: 'components.SubscribScheduledVideo.register',
  },
  waitingMessage: {
    defaultMessage:
      'You are registered for this event. Live will start at {date}.',
    description:
      'Message reminding the user, he has already registered and giving back the starting at date.',
    id: 'components.SubscribScheduledVideoEmail.waitingMessage',
  },
});

export const SubscribeScheduledVideo = ({
  video,
}: SubscribeScheduledVideoProps) => {
  const [daysLeft, setDaysLeft] = useState<Nullable<number>>(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [isTimeOver, setTimeOver] = useState(false);
  const [hasRegistered, setRegistered] = useState(false);
  const startingAt = useRef(
    DateTime.fromISO(video.starting_at!).setLocale(mainIntl.locale),
  );
  const intl = useIntl();
  const decodedJWT = getDecodedJwt();
  const initDays = () => {
    const diff = startingAt.current
      .diffNow(['days', 'hours', 'minutes', 'seconds'])
      .toObject();
    // Using diff.toISO() would be better but Clock grommet component is not able to manage
    // iso8601 period without hours.
    // We need to truncate values to simplify tests of checkDays
    const seconds = Math.trunc(Number(diff.seconds!));
    const days = Math.trunc(Number(diff.days!));
    setTimeLeft(`PT${diff.hours}H${diff.minutes}M${seconds!}S`);
    setDaysLeft(days);
  };

  const checkDays = (time: string) => {
    if (time === timeIsOver) {
      if (daysLeft === 0) {
        setTimeOver(true);
      } else {
        setDaysLeft(daysLeft! - 1);
        setTimeLeft(durationFullDay);
      }
    }
  };

  useAsyncEffect(async () => {
    await checkAlreadyRegistered();
    if (DateTime.now() > startingAt.current) {
      setTimeOver(true);
    } else {
      initDays();
    }
  }, []);

  const isLtiToken = () => {
    return (
      decodedJWT.context_id &&
      decodedJWT.consumer_site &&
      decodedJWT.user !== undefined &&
      decodedJWT.user!.id
    );
  };

  const checkAlreadyRegistered = async () => {
    // check user is already registered
    // we can only control if a user is registered if he has a LTI token
    if (isLtiToken()) {
      const registrations = await fetchList({
        queryKey: ['liveregistrations'],
        meta: {},
      });
      if (registrations.count > 0) {
        setRegistered(true);
      }
    }
  };

  if (isTimeOver) {
    return <WaitingLiveVideo />;
  } else {
    return (
      <Box direction={'row'}>
        <Box margin={'large'}>
          <Heading level="1">{video.title}</Heading>
          <Paragraph>{video!.description}</Paragraph>
          {!hasRegistered && (
            <Heading level="3">
              {intl.formatMessage(messages.register, {
                date: startingAt.current.toLocaleString(
                  DateTime.DATETIME_SHORT_WITH_SECONDS,
                ),
              })}
            </Heading>
          )}
          <Box pad="large">
            <Heading level="3">
              <Box>{intl.formatMessage(messages.daysLeft, { daysLeft })}</Box>
              {timeLeft && (
                <Clock
                  type="digital"
                  size="large"
                  time={timeLeft}
                  run="backward"
                  onChange={checkDays}
                />
              )}
            </Heading>
          </Box>
          {hasRegistered ? (
            <Notification
              status={'normal' as StatusType}
              title={intl.formatMessage(messages.waitingMessage, {
                date: startingAt.current.toLocaleString(
                  DateTime.DATETIME_SHORT_WITH_SECONDS,
                ),
              })}
            />
          ) : (
            <Box margin={'small'}>
              <SubscribeScheduledVideoEmailForm
                {...(isLtiToken() && getDecodedJwt().user!.email
                  ? { emailToken: getDecodedJwt().user!.email }
                  : {})}
              />
            </Box>
          )}
        </Box>
      </Box>
    );
  }
};

export default SubscribeScheduledVideo;
