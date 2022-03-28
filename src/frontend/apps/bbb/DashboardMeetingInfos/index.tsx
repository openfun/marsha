import { Box, Grid, Text } from 'grommet';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { MeetingInfos } from 'apps/bbb/types/models';

const messages = defineMessages({
  moderators: {
    defaultMessage: 'Moderators',
    description: 'Role name for moderators in dashboard meeting info view.',
    id: 'component.DashboardMeetingInfos.moderators',
  },
  participants: {
    defaultMessage: 'Participants',
    description: 'Role name for participants in dashboard meeting info view.',
    id: 'component.DashboardMeetingInfos.participants',
  },
  listeners: {
    defaultMessage: 'Listeners',
    description: 'Role name for listeners in dashboard meeting info view.',
    id: 'component.DashboardMeetingInfos.listeners',
  },
});

interface DashboardMeetingInfosItemProps {
  value: string;
  unit: 'moderators' | 'participants' | 'listeners';
}

const DashboardMeetingInfosItem = ({
  value,
  unit,
}: DashboardMeetingInfosItemProps) => {
  return (
    <Box>
      <Text size="large" weight="bold" color="blue-active" textAlign="center">
        {value}
      </Text>
      <Text color="blue-active" textAlign="center">
        <FormattedMessage {...messages[unit]} />
      </Text>
    </Box>
  );
};

interface DashboardMeetingInfosProps {
  infos?: MeetingInfos;
}

const DashboardMeetingInfos = ({ infos }: DashboardMeetingInfosProps) => {
  return (
    <Box
      margin={{ top: 'large' }}
      pad={{ vertical: 'small', horizontal: 'small' }}
      round="xsmall"
      border={{
        color: 'blue-active',
        size: 'small',
        side: 'all',
      }}
    >
      <Grid columns={{ count: 3, size: 'auto' }}>
        <DashboardMeetingInfosItem
          unit={'moderators'}
          value={infos?.moderatorCount || '0'}
        />
        <DashboardMeetingInfosItem
          unit={'participants'}
          value={infos?.voiceParticipantCount || '0'}
        />
        <DashboardMeetingInfosItem
          unit={'listeners'}
          value={infos?.listenerCount || '0'}
        />
      </Grid>
    </Box>
  );
};

export default DashboardMeetingInfos;
