import React, { useMemo } from 'react';
import { Box, Button, List } from 'grommet';
import { AddCircle } from 'grommet-icons';
import { defineMessages, useIntl } from 'react-intl';

import {
  useParticipantsStore,
  ParticipantType,
} from 'data/stores/useParticipantsStore';
import { Video } from 'types/tracks';
import { ViewersListHeader } from 'components/ViewersList/components/ViewersListHeader';
import { ViewersListItem } from 'components/ViewersList/components/ViewersListItem';
import { converse } from 'utils/window';
import { ViewersListItemContainer } from 'components/ViewersList/components/ViewersListItemContainer';
import { ViewersListTextButton } from 'components/ViewersList/components/ViewersListTextButton';

const messages = defineMessages({
  demands: {
    defaultMessage: 'Demands',
    description:
      'Participants asking for going on stage are displayed under this label.',
    id: 'components.ViewersList.demands',
  },
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
  acceptButton: {
    defaultMessage: 'Accept',
    description:
      'The text displayed in the button in charge of accepting on-stage request, in the viewers list.',
    id: 'components.ViewersList.acceptButton',
  },
  endOnStageButton: {
    defaultMessage: 'Terminate',
    description:
      'The text displayed in the button in charge of making students on stage exiting the stage, in the viewers list.',
    id: 'components.ViewersList.endOnStageButton',
  },
});

interface ViewersListProps {
  isInstructor: boolean;
  video: Video;
}

export const ViewersList = ({ isInstructor, video }: ViewersListProps) => {
  const participants = useParticipantsStore((state) => state.participants);
  const participantsOnStage = useMemo(
    () =>
      participants.filter(
        (participant) =>
          participant.isInstructor ||
          video.participants_in_discussion.some(
            (p) => p.name === participant.name,
          ),
      ),
    [participants, video.participants_in_discussion],
  );

  const participantsNotOnStageAndNotAsking = useMemo(
    () =>
      participants.filter(
        (participant) =>
          !participantsOnStage.includes(participant) &&
          (isInstructor
            ? !video.participants_asking_to_join.some(
                (p) => p.name === participant.name,
              )
            : true),
      ),
    [
      isInstructor,
      participants,
      participantsOnStage,
      video.participants_asking_to_join,
    ],
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
      pad={{ bottom: 'medium', top: '30px' }}
    >
      {isInstructor && video.participants_asking_to_join.length !== 0 && (
        <React.Fragment>
          <ViewersListHeader
            margin={{ left: 'medium', bottom: 'xsmall' }}
            text={intl.formatMessage(messages.demands)}
          />
          <List
            border={false}
            data={video.participants_asking_to_join.sort(
              (participantA, participantB) =>
                participantA.name.localeCompare(participantB.name),
            )}
            pad="none"
          >
            {(item: ParticipantType, index: number) => (
              <ViewersListItemContainer key={index}>
                <ViewersListItem
                  isInstructor={item.isInstructor}
                  name={item.name}
                />
                <Box direction="row" align="center" gap="small">
                  <Button
                    icon={<AddCircle color="red-active" size="20px" />}
                    onClick={() => converse.rejectParticipantToJoin(item)}
                    plain
                    style={{ padding: '0px', transform: 'rotate(45deg)' }}
                  />
                  <ViewersListTextButton
                    onClick={() =>
                      converse.acceptParticipantToJoin(item, video)
                    }
                    text={intl.formatMessage(messages.acceptButton)}
                  />
                </Box>
              </ViewersListItemContainer>
            )}
          </List>
        </React.Fragment>
      )}

      {participantsOnStage.length !== 0 && (
        <React.Fragment>
          <ViewersListHeader
            margin={{ left: 'medium', bottom: 'xsmall' }}
            text={intl.formatMessage(messages.onStage)}
          />
          <List border={false} data={participantsOnStage} pad="none">
            {(item: ParticipantType, index: number) => (
              <ViewersListItemContainer key={index}>
                <ViewersListItem
                  isInstructor={item.isInstructor}
                  name={item.name}
                />
                {isInstructor && !item.isInstructor && (
                  <ViewersListTextButton
                    onClick={() => converse.kickParticipant(item)}
                    text={intl.formatMessage(messages.endOnStageButton)}
                  />
                )}
              </ViewersListItemContainer>
            )}
          </List>
        </React.Fragment>
      )}
      {participantsNotOnStageAndNotAsking.length !== 0 && (
        <React.Fragment>
          <ViewersListHeader
            margin={{ left: 'medium', bottom: 'xsmall' }}
            text={intl.formatMessage(messages.otherViewers)}
          />
          <List
            border={false}
            data={participantsNotOnStageAndNotAsking}
            pad="none"
          >
            {(item: ParticipantType, index: number) => (
              <ViewersListItemContainer key={index}>
                <ViewersListItem
                  isInstructor={item.isInstructor}
                  name={item.name}
                />
              </ViewersListItemContainer>
            )}
          </List>
        </React.Fragment>
      )}
    </Box>
  );
};
