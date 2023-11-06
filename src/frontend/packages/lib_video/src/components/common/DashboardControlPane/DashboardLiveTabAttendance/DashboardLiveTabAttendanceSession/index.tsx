import { colorsTokens } from '@lib-common/cunningham';
import { CircleAlert, Clear, StatusGood, StatusGoodSmall } from 'grommet-icons';
import {
  Box,
  LiveAttendance,
  LiveAttendanceInfo,
  LiveAttendanceInfos,
  Text,
} from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  connectedDiligent: {
    defaultMessage: 'Very diligent',
    description:
      'Title on icon to indicate the participant was mostly present for the duration of the live',
    id: 'components.DashboardLiveControlPane.tab.DashboardLivettendance.DashboardLivettendanceSession.connectedOver80percent',
  },
  connectedPartially: {
    defaultMessage: 'Partially present',
    description:
      'Title on icon to indicate the participant has been partially present during the live',
    id: 'components.DashboardLiveControlPane.tab.DashboardLivettendance.DashboardLivettendanceSession.connectedPartially',
  },
  dotWasPresent: {
    defaultMessage: 'Present',
    description: 'Dot icon showing this slice of time the user was connected',
    id: 'components.DashboardLiveControlPane.tab.DashboardLivettendance.DashboardLivettendanceSession.dotWasPresent',
  },
  dotMissed: {
    defaultMessage: 'Missed',
    description:
      'Title on dot icon showing this slice of time the user was not connected',
    id: 'components.DashboardLiveControlPane.tab.DashboardLivettendance.DashboardLivettendanceSession.dotMissed',
  },
  notConnected: {
    defaultMessage: 'Missed the live',
    description: 'Title on icon to indicate that the user was not present',
    id: 'components.DashboardLiveControlPane.tab.DashboardLivettendance.DashboardLivettendanceSession.notConnected',
  },
});

interface DashboardLiveTabAttendanceSessionProps {
  liveSession: LiveAttendance;
}
export const DashboardLiveTabAttendanceSession = ({
  liveSession,
}: DashboardLiveTabAttendanceSessionProps) => {
  // over 80% of attendance, the user is considered very diligent
  const diligentLimit = 80;
  const isConnected = (liveAttendanceInfo: LiveAttendanceInfo) => {
    return (
      liveAttendanceInfo.onStage ||
      liveAttendanceInfo.connectedInBetween ||
      liveAttendanceInfo.playing
    );
  };

  const getFormattedInfo = (liveAttendances: LiveAttendanceInfos) => {
    let nbConnected = 0;
    const length = Object.keys(liveAttendances).length;

    const info = Object.values(liveAttendances).map(
      (liveAttendance: LiveAttendanceInfo) => {
        const connected = isConnected(liveAttendance);
        if (connected) {
          nbConnected++;
        }
        return connected;
      },
    );

    return {
      percent: length ? Math.round((nbConnected / length) * 100) : 0,
      info,
    };
  };
  const intl = useIntl();
  const infoSession = getFormattedInfo(liveSession.live_attendance ?? []);
  const zeroPercent = infoSession.percent === 0;

  const badge =
    infoSession.percent >= diligentLimit ? (
      <StatusGood
        a11yTitle={intl.formatMessage(messages.connectedDiligent)}
        color={colorsTokens['info-500']}
        key={liveSession.id}
      />
    ) : zeroPercent ? (
      <Clear
        a11yTitle={intl.formatMessage(messages.notConnected)}
        color="red-active"
        key={liveSession.id}
      />
    ) : (
      <CircleAlert
        a11yTitle={intl.formatMessage(messages.connectedPartially)}
        color={colorsTokens['info-500']}
        key={liveSession.id}
      />
    );

  return (
    <Box
      align="center"
      justify="space-between"
      direction="row"
      gap="small"
      pad={{ horizontal: 'medium', vertical: 'xsmall' }}
      data-testid="live-attendance"
    >
      <Box direction="row" pad="medium">
        {badge}
        <Text
          color={zeroPercent ? 'clr-danger-300' : undefined}
          weight={liveSession.is_registered ? 'bold' : 'medium'}
          className="ml-b"
        >
          {liveSession.display_name}
        </Text>
      </Box>
      <Box align="center" direction="row" gap="2px">
        <Box
          background={
            zeroPercent ? colorsTokens['danger-400'] : colorsTokens['info-400']
          }
          margin={{ right: 'medium' }}
          width="6rem"
          round="6px"
          pad="small"
        >
          <Text textAlign="center" color="white" size="small">
            {zeroPercent ? '-' : `${infoSession.percent}  %`}
          </Text>
        </Box>

        {infoSession.info.map((isPresent, index) =>
          isPresent ? (
            <StatusGoodSmall
              data-testid={`Present_${liveSession.id}_${index}`}
              a11yTitle={intl.formatMessage(messages.dotWasPresent)}
              color={colorsTokens['info-500']}
              key={`${liveSession.id}_${index}`}
              size="small"
            />
          ) : (
            <StatusGoodSmall
              data-testid={`Missed_${liveSession.id}_${index}`}
              a11yTitle={intl.formatMessage(messages.dotMissed)}
              color="light-6"
              key={`${liveSession.id}_${index}`}
              size="small"
            />
          ),
        )}
      </Box>
    </Box>
  );
};
