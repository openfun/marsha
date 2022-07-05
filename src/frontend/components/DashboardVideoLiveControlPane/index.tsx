import { Box, Tabs, Tab, ThemeContext } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Video } from 'types/tracks';
import { theme } from 'utils/theme/theme';
import { DashboardVideoLiveTabAttendance } from './tab/DashboardVideoLiveTabAttendance';
import { DashboardVideoLiveTabConfiguration } from './tab/DashboardVideoLiveTabConfiguration';

const messages = defineMessages({
  titleConfiguration: {
    defaultMessage: 'configuration',
    description:
      'Title of the tab used to configure the live in capital letters',
    id: 'components.DashboardVideoLiveControlPane.titleConfiguration',
  },
  titleAttendance: {
    defaultMessage: 'attendances',
    description:
      'Title of the tab used to watch attendance of the live in capital letters',
    id: 'components.DashboardVideoLiveControlPane.titleAttendance',
  },
});
interface DashboardVideoLiveControlPaneProps {
  video: Video;
}
export const DashboardVideoLiveControlPane = ({
  video,
}: DashboardVideoLiveControlPaneProps) => {
  const intl = useIntl();
  const extendedTheme = {
    tabs: {
      header: {
        extend: 'button * { \
          font-size: 16px; \
        }',
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
            <DashboardVideoLiveTabConfiguration video={video} />
          </Tab>
          <Tab title={intl.formatMessage(messages.titleAttendance)}>
            <DashboardVideoLiveTabAttendance video={video} />
          </Tab>
        </Tabs>
      </ThemeContext.Extend>
    </Box>
  );
};
