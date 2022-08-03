import { Box, Grid, Text } from 'grommet';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { ClassroomInfos } from 'apps/bbb/types/models';

const messages = defineMessages({
  moderators: {
    defaultMessage: 'Moderators',
    description: 'Role name for moderators in dashboard classroom info view.',
    id: 'component.DashboardClassroomInfos.moderators',
  },
  participants: {
    defaultMessage: 'Participants',
    description: 'Role name for participants in dashboard classroom info view.',
    id: 'component.DashboardClassroomInfos.participants',
  },
  listeners: {
    defaultMessage: 'Listeners',
    description: 'Role name for listeners in dashboard classroom info view.',
    id: 'component.DashboardClassroomInfos.listeners',
  },
});

interface DashboardClassroomInfosItemProps {
  value: string;
  unit: 'moderators' | 'participants' | 'listeners';
}

const DashboardClassroomInfosItem = ({
  value,
  unit,
}: DashboardClassroomInfosItemProps) => {
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

interface DashboardClassroomInfosProps {
  infos?: ClassroomInfos;
}

const DashboardClassroomInfos = ({ infos }: DashboardClassroomInfosProps) => {
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
        <DashboardClassroomInfosItem
          unit={'moderators'}
          value={infos?.moderatorCount || '0'}
        />
        <DashboardClassroomInfosItem
          unit={'participants'}
          value={infos?.voiceParticipantCount || '0'}
        />
        <DashboardClassroomInfosItem
          unit={'listeners'}
          value={infos?.listenerCount || '0'}
        />
      </Grid>
    </Box>
  );
};

export default DashboardClassroomInfos;
