import React from 'react';
import { Box, List } from 'grommet';
import { defineMessages, useIntl } from 'react-intl';

import {
  useParticipantsStore,
  ParticipantType,
} from 'data/stores/useParticipantsStore/index';
import { Video } from 'types/tracks';
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

interface StudentViewersListProps {
  video: Video;
}

export const StudentViewersList = ({ video }: StudentViewersListProps) => {
  const participants = useParticipantsStore((state) => state.participants);
  const participantsOnStage = participants.filter(
    (participant) =>
      video.participants_in_discussion.some(
        (p) => p.name === participant.name,
      ) || participant.isInstructor,
  );

  const participantsNotOnStage = participants.filter(
    (participant) => !participantsOnStage.includes(participant),
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
