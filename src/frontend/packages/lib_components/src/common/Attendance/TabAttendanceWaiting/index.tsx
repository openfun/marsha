import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { Box, Heading } from '@lib-components/common';
import { useAppConfig } from '@lib-components/data/stores/useAppConfig';

const messages = defineMessages({
  noParticipants: {
    defaultMessage: 'The {type} has no participant yet',
    description: 'Message displayed if the live has no participant yet',
    id: 'components.DashboardLiveControlPane.tab.DashboardLiveTabAttendance.DashboardLiveTabAttendanceWaiting.noParticipants',
  },
});

interface TabAttendanceWaitingProps {
  type: 'webinar' | 'classroom';
}

export const TabAttendanceWaiting = ({ type }: TabAttendanceWaitingProps) => {
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
          round="6px"
          margin="small"
          pad="large"
          style={{
            boxShadow: '0px 0px 6px 0px rgba(2, 117, 180, 0.3)',
          }}
        >
          <Heading level={3} textAlign="center" className="m-0">
            {intl.formatMessage(messages.noParticipants, {
              type,
            })}
          </Heading>
        </Box>
      </Box>
    </Box>
  );
};
