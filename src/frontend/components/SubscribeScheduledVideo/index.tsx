import {
  Box,
  Clock,
  Heading,
  Notification,
  Paragraph,
  StatusType,
} from 'grommet';
import React, { useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useAsyncEffect } from '../../utils/useAsyncEffect';
import { Video } from '../../types/tracks';
import { SubscribeScheduledVideoEmailForm } from '../SubscribeScheduledVideoEmailForm';
import { getDurationsFromStartingDate, getTHMSFromMs } from '../../utils/date';
import { getDecodedJwt } from '../../data/appData';
import { fetchList } from '../../data/queries/fetchList';
/** Props shape for the SubscribeScheduledVideo component. */
interface SubscribeScheduledVideoProps {
  video: Video;
}

const messages = defineMessages({
  daysLeft: {
    defaultMessage:
      'Days left {daysLeft,number} {daysLeft, plural, one {day} other {days}}',
    description:
      'Text message to inform on number of days left before the event starts',
    id: 'components.SubscribScheduledVideo.daysLeft',
  },
  register: {
    defaultMessage: 'Register to this event starting on {date}',
    description: 'Text message to ask if user is already registered ?',
    id: 'components.SubscribScheduledVideo.register',
  },
  waitingMessage: {
    defaultMessage:
      'You are registered for this event. Live will start at {date}.',
    description:
      'Message reminding the user, he is already registered and giving back the starting at date.',
    id: 'components.SubscribScheduledVideoEmail.waitingMessage',
  },
});

export const SubscribeScheduledVideo = (props: SubscribeScheduledVideoProps) => {
  const [daysLeft, setDaysLeft] = useState(0);
  const [timeLeft, setTimeLeft] = useState('');
  const [isAlreadyRegistered, setAlreadyRegistered] = useState(false);
  const startingAt = new Date(props.video.starting_at!);
  const intl = useIntl();
  const checkDays = () => {
    const durations = getDurationsFromStartingDate(startingAt);

    if (daysLeft === 0 || durations.days < daysLeft) {
      setTimeLeft(getTHMSFromMs(durations.ms));
      setDaysLeft(durations.days);
    }
  };
  useAsyncEffect(async () => {
    await checkAlreadyRegistered();
    checkDays();
  }, []);

  const hasUserInToken = () => {
    return getDecodedJwt().user !== undefined;
  };

  const hasEmailInToken = () => {
    return hasUserInToken() && getDecodedJwt().user!.email;
  };

  const canIcheckIfIamRegistered = () => {
    return (
      hasUserInToken() &&
      (getDecodedJwt().user!.email ||
        (getDecodedJwt().user!.id && getDecodedJwt().context_id))
    );
  };

  const checkAlreadyRegistered = async () => {
    // check user is already registered, if so redirect him to the waiting screen
    // we can only control if a user is registered if he has a token defined in his email or if he has a context_id and a user.id
    if (canIcheckIfIamRegistered()) {
      const registrations = await fetchList({
        queryKey: ['liveregistrations'],
        meta:{}
      });
      if (registrations.count > 0) {
        setAlreadyRegistered(true);
      }
    }
  };

  return (
    <Box direction={'row'}>
      <Box margin={'large'}>
        <Heading level="1">{props.video.title}</Heading>
        <Paragraph>{props.video!.description}</Paragraph>
        {!isAlreadyRegistered && (
          <Heading level="3">
            <FormattedMessage
              {...messages.register}
              values={{ date: new Date(startingAt).toLocaleString() }}
            />
          </Heading>
        )}
        <Box pad="large">
          <Heading level="3">
            <Box>
              <FormattedMessage
                {...messages.daysLeft}
                values={{
                  daysLeft,
                }}
              />
            </Box>
            <Clock
              type="digital"
              size="large"
              time={timeLeft}
              run="backward"
              onChange={checkDays}
            />
          </Heading>
        </Box>
        {isAlreadyRegistered ? (
          <Notification
            status={'normal' as StatusType}
            title={intl.formatMessage(messages.waitingMessage, {
              date: new Date(startingAt).toLocaleString(),
            })}
          />
        ) : (
          <Box margin={'small'}>
            <SubscribeScheduledVideoEmailForm
              emailToken={
                hasEmailInToken() ? getDecodedJwt().user!.email : null
              }
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};