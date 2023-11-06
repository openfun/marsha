import { Box, Heading, useAppConfig } from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  noParticipants: {
    defaultMessage: 'The live has no participant yet',
    description: 'Message displayed if the live has no participant yet',
    id: 'components.DashboardLiveControlPane.tab.DashboardLiveTabAttendance.DashboardLiveTabAttendanceWaiting.noParticipants',
  },
});

export const DashboardLiveTabAttendanceWaiting = ({}) => {
  const intl = useIntl();
  const appData = useAppConfig();

  return (
    <Box
      background={`url(${appData.static.img.liveBackground}) top / cover no-repeat`}
      margin={{ top: 'small' }}
      pad={{ top: 'small' }}
    >
      <Box margin="auto" pad={{ horizontal: 'none', vertical: 'large' }}>
        <Box
          background="white"
          fill
          round="6px"
          margin={{ bottom: 'small', horizontal: 'auto', top: 'none' }}
          pad="large"
          style={{
            boxShadow: '0px 0px 6px 0px rgba(2, 117, 180, 0.3)',
          }}
        >
          <Box margin="auto" pad={{ horizontal: '36px' }}>
            <Heading level={3} textAlign="center" className="m-0">
              {intl.formatMessage(messages.noParticipants)}
            </Heading>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
