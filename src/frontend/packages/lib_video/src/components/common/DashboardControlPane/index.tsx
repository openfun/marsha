import { Box, Tabs, Tab, ThemeContext } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { theme } from 'lib-common';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { VideoWidgetProvider } from '@lib-video/components/common/VideoWidgetProvider';

import { DashboardLiveTabAttendance } from './DashboardLiveTabAttendance';
import { DashboardTabStatistics } from './DashboardTabStatistics';

export const enum PaneTabs {
  STATS = 'statistics',
  ATTENDANCE = 'attendance',
}

const messages = defineMessages({
  titleConfiguration: {
    defaultMessage: 'configuration',
    description:
      'Title of the tab used to configure the live in capital letters',
    id: 'components.DashboardLiveControlPane.titleConfiguration',
  },
  titleAttendance: {
    defaultMessage: 'attendances',
    description:
      'Title of the tab used to watch attendance of the live in capital letters',
    id: 'components.DashboardLiveControlPane.titleAttendance',
  },
  titleStats: {
    defaultMessage: 'statistics',
    description:
      'Title of the tab used to monitor statistics about the video diffusion',
    id: 'components.DashboardLiveControlPane.titleStats',
  },
});

export interface DashboarControlPaneParams {
  isLive: boolean;
  tabs?: PaneTabs[];
}

export const DashboardControlPane = ({
  isLive,
  tabs = [PaneTabs.ATTENDANCE],
}: DashboarControlPaneParams) => {
  const intl = useIntl();
  const extendedTheme = {
    tabs: {
      header: {
        extend: `button * { \
          font-size: 16px; \
        }`,
      },
    },
    tab: {
      extend: ` color:${normalizeColor('blue-active', theme)};\
        font-family: 'Roboto-Bold';\
        height: 21px;\
        letter-spacing: -0.36px;\
        padding-bottom:35px;\
        padding-left:50px;\
        padding-right:50px;\
        padding-top:15px;\
        text-align: center;\
        text-transform: uppercase; \
        `,
      border: {
        color: 'inherit',
        size: 'medium',
      },
    },
  };

  return (
    <Box background={{ color: 'bg-marsha' }}>
      <ThemeContext.Extend value={extendedTheme}>
        <Tabs>
          <Tab title={intl.formatMessage(messages.titleConfiguration)}>
            <VideoWidgetProvider isLive={isLive} isTeacher />
          </Tab>
          {tabs.includes(PaneTabs.STATS) && (
            <Tab title={intl.formatMessage(messages.titleStats)}>
              <DashboardTabStatistics />
            </Tab>
          )}
          {tabs.includes(PaneTabs.ATTENDANCE) && (
            <Tab title={intl.formatMessage(messages.titleAttendance)}>
              <DashboardLiveTabAttendance />
            </Tab>
          )}
        </Tabs>
      </ThemeContext.Extend>
    </Box>
  );
};
