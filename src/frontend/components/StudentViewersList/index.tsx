import React from 'react';
import { Box, List } from 'grommet';
import { defineMessages, useIntl } from 'react-intl';

import {
  useParticipantsStore,
  ParticipantType,
} from 'data/stores/useParticipantsStore/index';
import { StudentViewersListHeader } from './StudentViewersListHeader';
import { StudentViewersListItem } from './StudentViewersListItem';

const messages = defineMessages({
  onStage: {
    defaultMessage: 'On stage',
    description: 'On-stage participants are displayed under this label.',
    id: 'components.ViewersList.onStage',
  },
  otherViewers: {
    defaultMessage: 'Other participants',
    description: 'Connected participants are displayed under this label.',
    id: 'components.ViewersList.otherViewers',
  },
});

export const StudentViewersList = () => {
  const participants = useParticipantsStore((state) => state.participants);
  const participantsOnStage = participants.filter(
    (participant) => participant.isOnStage || participant.isInstructor,
  );
  const participantsNotOnStage = participants.filter(
    (participant) => !participant.isOnStage && !participant.isInstructor,
  );
  const intl = useIntl();

  return (
    <Box
      fill
      gap="30px"
      overflow={{
        horizontal: 'hidden',
        vertical: 'auto',
      }}
      pad={{ bottom: '20px', horizontal: '20px', top: '30px' }}
    >
      {participantsOnStage.length !== 0 && (
        <Box>
          <StudentViewersListHeader
            text={intl.formatMessage(messages.onStage)}
          />
          <List border={false} data={participantsOnStage} pad={{ top: '8px' }}>
            {(item: ParticipantType, index: number) => (
              <StudentViewersListItem
                isInstructor={item.isInstructor}
                key={index}
                name={item.name}
              />
            )}
          </List>
        </Box>
      )}
      <Box>
        <StudentViewersListHeader
          text={intl.formatMessage(messages.otherViewers)}
        />
        <List border={false} data={participantsNotOnStage} pad={{ top: '8px' }}>
          {(item: ParticipantType, index: number) => (
            <StudentViewersListItem
              isInstructor={item.isInstructor}
              key={index}
              name={item.name}
            />
          )}
        </List>
      </Box>
    </Box>
  );
};
