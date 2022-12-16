import { Box, Tabs, Tab, ThemeContext } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { theme } from 'lib-common';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { VideoWidgetProvider } from 'components/common/VideoWidgetProvider';

import { DashboardLiveTabAttendance } from './DashboardLiveTabAttendance';

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
});

export interface DashboarControlPaneParams {
  isLive: boolean;
}

export const DashboardControlPane = ({ isLive }: DashboarControlPaneParams) => {
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
          <Tab title={intl.formatMessage(messages.titleAttendance)}>
            <DashboardLiveTabAttendance />
          </Tab>
        </Tabs>
      </ThemeContext.Extend>
    </Box>
  );
};
