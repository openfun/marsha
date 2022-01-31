import { Box, Clock, Heading, Paragraph } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { DateTime } from 'luxon';
import React, {
  Fragment,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { ChronometerSVG } from 'components/SVGIcons/ChronometerSVG';
import { theme } from 'utils/theme/theme';

const Header = ({ title }: { title: ReactNode }) => (
  <Heading
    color={normalizeColor('blue-active', theme)}
    level={5}
    margin="none"
    style={{ display: 'flex' }}
  >
    {title}
  </Heading>
);

const StyledClock = styled(Clock)`
  color: ${normalizeColor('blue-hover', theme)};
`;

function splitDay(dateTime: DateTime) {
  // Using diff.toISO() would be better but Clock grommet component is not able to manage
  // iso8601 period without hours.
  const diff = dateTime
    .diffNow(['days', 'hours', 'minutes', 'seconds'])
    .toObject();

  // We need to truncate values to simplify tests of checkDays
  const seconds = Math.trunc(Number(diff.seconds || 0));
  const days = Math.trunc(Number(diff.days || 0));
  return {
    days,
    hours: diff.hours || 0,
    minutes: diff.minutes || 0,
    seconds,
  };
}

const timeIsOver = 'P0H0M0S';
const durationFullDay = 'PT23H59M59S';
const messages = defineMessages({
  timeEnded: {
    defaultMessage: 'Live is starting',
    description:
      'Text message to inform expected start date for the event has passed and the event should start at any moment',
    id: 'components.StudentLiveScheduleInfo.timeEnded',
  },
  waitingMessage: {
    defaultMessage:
      'You can wait here, the page will be refreshed as soon as the event starts.',
    description:
      'Message display when the live is starting to tell the user to wait in the current page, it will be refresh automaticaly',
    id: 'components.StudentLiveScheduleInfo.waitingMessage',
  },
  timeLeft: {
    defaultMessage: 'Live will start in ',
    description:
      'Text message to inform duration (HH:mm:ss) before the event starts',
    id: 'components.StudentLiveScheduleInfo.timeLeft',
  },
  dayLeft: {
    defaultMessage: 'Live will starts tomorrow at {hour}',
    description:
      'Text message to inform at what time the event will start tomorrow',
    id: 'components.StudentLiveScheduleInfo.dayLeft',
  },
  daysLeft: {
    defaultMessage: 'Live will start in {daysLeft} days at {hour}',
    description:
      'Text message to inform on number of days left before the event starts and at what time',
    id: 'components.StudentLiveScheduleInfo.daysLeft',
  },
});

interface StudentLiveScheduleInfoProps {
  isTimeOver: boolean;
  startDate?: DateTime;
  setTimeIsOver: () => void;
}

export const StudentLiveScheduleInfo = ({
  isTimeOver,
  startDate,
  setTimeIsOver,
}: StudentLiveScheduleInfoProps) => {
  const intl = useIntl();
  const split = useMemo(() => {
    if (!startDate) {
      return undefined;
    }

    return splitDay(startDate);
  }, [startDate]);
  const [dayCount, setDayCount] = useState(split?.days ?? 0);
  const [targetTime, setTargetTime] = useState(
    `PT${split?.hours ?? 0}H${split?.minutes ?? 0}M${split?.seconds ?? 0}S`,
  );
  const [isWaitEnded, setIsWaitEnded] = useState(
    dayCount <= 0 &&
      split !== undefined &&
      split.hours <= 0 &&
      split.minutes <= 0 &&
      split.seconds <= 0,
  );

  const onClockChange = (remainingTime: string) => {
    if (remainingTime !== timeIsOver) {
      return;
    }

    if (dayCount === 0) {
      setIsWaitEnded(true);
    } else {
      setDayCount((currentDayCount) => currentDayCount - 1);
      setTargetTime(durationFullDay);
    }
  };

  useEffect(() => {
    if (isWaitEnded) {
      //  alert parent that time is over to hide registration form
      setTimeIsOver();
    }
  }, [isWaitEnded]);

  const localizedStartDate = startDate?.setLocale(intl.locale) ?? undefined;

  if (isTimeOver || isWaitEnded || localizedStartDate === undefined) {
    return (
      <Fragment>
        <Box margin="auto" pad={{ horizontal: '36px' }}>
          <Heading
            color={normalizeColor('blue-active', theme)}
            level={3}
            margin="auto"
          >
            {intl.formatMessage(messages.timeEnded)}
          </Heading>
          <Paragraph
            alignSelf="center"
            color={normalizeColor('blue-active', theme)}
            textAlign="center"
            margin={{ horizontal: 'auto', top: 'small' }}
          >
            {intl.formatMessage(messages.waitingMessage)}
          </Paragraph>
        </Box>
      </Fragment>
    );
  }

  let waitDurationInfo;
  if (dayCount === 0) {
    waitDurationInfo = (
      <Header
        title={
          <Fragment>
            {intl.formatMessage(messages.timeLeft)}
            <StyledClock
              color={normalizeColor('blue-active', theme)}
              margin={{ left: 'xsmall' }}
              onChange={onClockChange}
              run="backward"
              time={targetTime}
              type="digital"
            />
          </Fragment>
        }
      />
    );
  } else if (dayCount === 1) {
    waitDurationInfo = (
      <Header
        title={intl.formatMessage(messages.dayLeft, {
          hour: localizedStartDate.toLocaleString(DateTime.TIME_SIMPLE),
        })}
      />
    );
  } else {
    waitDurationInfo = (
      <Header
        title={intl.formatMessage(messages.daysLeft, {
          daysLeft: dayCount,
          hour: localizedStartDate.toLocaleString(DateTime.TIME_SIMPLE),
        })}
      />
    );
  }

  return (
    <Fragment>
      <ChronometerSVG
        containerStyle={{ position: 'absolute' }}
        height="36px"
        iconColor={normalizeColor('blue-active', theme)}
      />

      <Box margin="auto" pad={{ horizontal: '36px' }}>
        <Box direction="row" margin="auto">
          {waitDurationInfo}
        </Box>
        {localizedStartDate && (
          <Box direction="row" margin={{ bottom: 'small' }} width="100%">
            <Box
              background={normalizeColor('blue-active', theme)}
              flex="grow"
              height="2px"
              margin={{ right: 'xsmall', vertical: 'auto' }}
            />
            <Paragraph
              color={normalizeColor('blue-active', theme)}
              margin="auto"
            >
              {localizedStartDate.toLocaleString(
                DateTime.DATE_MED_WITH_WEEKDAY,
              )}
            </Paragraph>
            <Box
              background={normalizeColor('blue-active', theme)}
              flex="grow"
              height="2px"
              margin={{ left: 'xsmall', vertical: 'auto' }}
            />
          </Box>
        )}
      </Box>
    </Fragment>
  );
};
