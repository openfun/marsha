import React, { ReactNode, useMemo } from 'react';
import { Box, Button, List, Paragraph } from 'grommet';
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
import { normalizeColor } from 'grommet/utils';
import { colors } from 'utils/theme/theme';

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
  nobodyOnStage: {
    defaultMessage:
      'Oops, nobody is on stage. Wait for your teacher to ask joining the stage.',
    description:
      'Message displayed in the users list for viewers when nobody is on stage',
    id: 'components.ViewersList.nobodyOnStage',
  },
  noViewers: {
    defaultMessage: 'No viewers are currently connected to your stream.',
    description:
      'Message displayed in the users list when no viewers are connected',
    id: 'components.ViewersList.noViewers',
  },
});

interface SectionProps {
  children?: (item: ParticipantType) => ReactNode;
  items: ParticipantType[];
  noItemsTitle?: string;
  title: string;
}

const Section = ({ children, items, noItemsTitle, title }: SectionProps) => {
  if (items.length === 0 && !noItemsTitle) {
    //  no content to render
    return null;
  }

  return (
    <Box margin={{ top: 'medium' }}>
      {(items.length !== 0 || noItemsTitle) && (
        <ViewersListHeader
          margin={{ left: 'medium', bottom: 'xsmall' }}
          text={title}
        />
      )}
      {items.length !== 0 && (
        <List border={false} data={items} pad={{ top: '8px' }}>
          {(item: ParticipantType, index: number) => (
            <ViewersListItemContainer key={index}>
              <ViewersListItem
                isInstructor={item.isInstructor}
                name={item.name}
              />
              {children && children(item)}
            </ViewersListItemContainer>
          )}
        </List>
      )}
      {items.length === 0 && noItemsTitle && (
        <Paragraph
          color={normalizeColor('blue-chat', colors)}
          margin={{ horizontal: 'medium', top: 'small', bottom: 'none' }}
          size="0.7rem"
        >
          {noItemsTitle}
        </Paragraph>
      )}
    </Box>
  );
};

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
  const participantsAskingToJoin = useMemo(
    () =>
      video.participants_asking_to_join
        .sort((participantA, participantB) =>
          participantA.name.localeCompare(participantB.name),
        )
        .map((item) => ({
          id: item.id,
          isInstructor: false,
          isOnStage: false,
          name: item.name,
        })),
    [video.participants_asking_to_join],
  );
  const intl = useIntl();

  return (
    <Box
      fill
      overflow={{
        horizontal: 'hidden',
        vertical: 'auto',
      }}
    >
      {isInstructor && (
        <Section
          items={participantsAskingToJoin}
          title={intl.formatMessage(messages.demands)}
        >
          {(item: ParticipantType) => (
            <Box direction="row" align="center" gap="small">
              <Button
                icon={<AddCircle color="red-active" size="20px" />}
                onClick={() => converse.rejectParticipantToJoin(item)}
                plain
                style={{ padding: '0px', transform: 'rotate(45deg)' }}
              />
              <ViewersListTextButton
                onClick={() => converse.acceptParticipantToJoin(item, video)}
                text={intl.formatMessage(messages.acceptButton)}
              />
            </Box>
          )}
        </Section>
      )}

      <Section
        items={participantsOnStage}
        noItemsTitle={intl.formatMessage(messages.nobodyOnStage)}
        title={intl.formatMessage(messages.onStage)}
      >
        {(item: ParticipantType) =>
          isInstructor &&
          !item.isInstructor && (
            <ViewersListTextButton
              onClick={() => converse.kickParticipant(item)}
              text={intl.formatMessage(messages.endOnStageButton)}
            />
          )
        }
      </Section>

      <Section
        items={participantsNotOnStageAndNotAsking}
        noItemsTitle={intl.formatMessage(messages.noViewers)}
        title={intl.formatMessage(messages.otherViewers)}
      />
    </Box>
  );
};
