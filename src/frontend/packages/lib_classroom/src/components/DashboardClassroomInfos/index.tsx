import { Nullable, colorsTokens } from 'lib-common';
import { Box, ClassroomInfos, Grid, Text } from 'lib-components';
import React, { Fragment } from 'react';
import { FormattedMessage, defineMessages } from 'react-intl';

import DashboardCopyClipboard from '@lib-classroom/components/DashboardCopyClipboard';

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
      <Text size="large" weight="bold" textAlign="center">
        {value}
      </Text>
      <Text textAlign="center">
        <FormattedMessage {...messages[unit]} />
      </Text>
    </Box>
  );
};

interface DashboardClassroomInfosProps {
  inviteToken: Nullable<string>;
  instructorToken: Nullable<string>;
  infos?: ClassroomInfos;
  classroomId: string;
}

const DashboardClassroomInfos = ({
  infos,
  inviteToken,
  instructorToken,
  classroomId,
}: DashboardClassroomInfosProps) => {
  return (
    <Fragment>
      <Box
        margin={{ top: 'large' }}
        pad={{ vertical: 'small', horizontal: 'small' }}
        round="xsmall"
        style={{ border: `solid 1px ${colorsTokens['primary-500']}` }}
        className="DashboardClassroomInfos"
      >
        <Grid columns={{ count: 3, size: 'auto' }}>
          <DashboardClassroomInfosItem
            unit="moderators"
            value={infos?.moderatorCount || '0'}
          />
          <DashboardClassroomInfosItem
            unit="participants"
            value={infos?.voiceParticipantCount || '0'}
          />
          <DashboardClassroomInfosItem
            unit="listeners"
            value={infos?.listenerCount || '0'}
          />
        </Grid>
      </Box>
      <Box margin={{ top: 'large' }}>
        <DashboardCopyClipboard
          inviteToken={inviteToken}
          instructorToken={instructorToken}
          classroomId={classroomId}
        />
      </Box>
    </Fragment>
  );
};

export default DashboardClassroomInfos;
