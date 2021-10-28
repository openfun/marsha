import { Table, TableBody, TableCell, TableHeader, TableRow } from 'grommet';
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

interface DashboardMeetingInfosProps {
  infos?: MeetingInfos;
}

const DashboardMeetingInfos = ({ infos }: DashboardMeetingInfosProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableCell>
            <FormattedMessage {...messages.moderators} />
          </TableCell>
          <TableCell>
            <FormattedMessage {...messages.participants} />
          </TableCell>
          <TableCell>
            <FormattedMessage {...messages.listeners} />
          </TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>{infos?.moderatorCount || 0}</TableCell>
          <TableCell>{infos?.voiceParticipantCount || 0}</TableCell>
          <TableCell>{infos?.listenerCount || 0}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};

export default DashboardMeetingInfos;
