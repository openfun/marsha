import { Box, Button } from 'grommet';
import { AddCircle } from 'grommet-icons';
import { JoinMode, List, Text } from 'lib-components';
import React, { ReactNode, useMemo } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { useCurrentVideo } from '@lib-video/hooks/useCurrentVideo';
import {
  ParticipantType,
  useParticipantsStore,
} from '@lib-video/hooks/useParticipantsStore';
import { isAnonymous } from '@lib-video/utils/chat/chat';
import { converse } from '@lib-video/utils/window';

import { ViewersListHeader } from './components/ViewersListHeader';
import { ViewersListItem } from './components/ViewersListItem';
import { ViewersListItemContainer } from './components/ViewersListItemContainer';
import { ViewersListTextButton } from './components/ViewersListTextButton';
import {
  generateSimpleViewersMessage,
  sortParticipantNotOnStage,
} from './utils';

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
});

interface SectionProps {
  children?: (item: ParticipantType) => ReactNode;
  items: ParticipantType[];
  noItemsTitle?: string;
  title: string;
  forceNoItemsTitle?: boolean;
}

const Section = ({
  children,
  items,
  noItemsTitle,
  title,
  forceNoItemsTitle,
}: SectionProps) => {
  if (items.length === 0 && !noItemsTitle && !forceNoItemsTitle) {
    //  no content to render
    return null;
  }

  return (
    <Box height={{ min: 'auto' }} style={{ gap: '0.5rem' }}>
      <ViewersListHeader
        margin={{ left: 'medium' }}
        text={`${title} (${items.length})`}
      />

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

      {(items.length === 0 || forceNoItemsTitle) && (
        <Text className="mt-s mb-0 ml-b mr-b" size="small">
          {noItemsTitle}
        </Text>
      )}
    </Box>
  );
};

interface ViewersListProps {
  isInstructor: boolean;
}

export const ViewersList = ({ isInstructor }: ViewersListProps) => {
  const video = useCurrentVideo();
  const intl = useIntl();
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
  const simpleViewersWithName = useMemo(
    () =>
      participantsNotOnStageAndNotAsking
        .filter((participant) => !isAnonymous(participant.name))
        .sort(sortParticipantNotOnStage),
    [participantsNotOnStageAndNotAsking],
  );
  const anonymousViewersCount = useMemo(() => {
    return (
      participantsNotOnStageAndNotAsking.length - simpleViewersWithName.length
    );
  }, [participantsNotOnStageAndNotAsking, simpleViewersWithName]);
  const participantsAskingToJoin = useMemo(
    () =>
      video.participants_asking_to_join
        .sort((participantA, participantB) =>
          participantA.name.localeCompare(participantB.name),
        )
        .map((item) => ({
          id: item.id,
          userJid: '',
          isInstructor: false,
          isOnStage: false,
          name: item.name,
        })),
    [video.participants_asking_to_join],
  );

  const viewersMessage = generateSimpleViewersMessage(
    intl,
    simpleViewersWithName.length,
    anonymousViewersCount,
  );

  return (
    <Box
      fill
      overflow={{
        horizontal: 'hidden',
        vertical: 'auto',
      }}
      style={{ gap: '1rem' }}
    >
      {isInstructor && video.join_mode === JoinMode.APPROVAL && (
        <Section
          items={participantsAskingToJoin}
          title={intl.formatMessage(messages.demands)}
        >
          {(item: ParticipantType) => (
            <Box direction="row" align="center" gap="small">
              <Button
                icon={<AddCircle color="red-active" size="20px" />}
                onClick={() => {
                  converse.rejectParticipantToJoin(item);
                }}
                plain
                style={{ padding: '0px', transform: 'rotate(45deg)' }}
              />
              <ViewersListTextButton
                onClick={() => {
                  converse.acceptParticipantToJoin(item, video);
                }}
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
          !item.isInstructor &&
          video.join_mode !== JoinMode.FORCED && (
            <ViewersListTextButton
              onClick={() => {
                converse.kickParticipant(item);
              }}
              text={intl.formatMessage(messages.endOnStageButton)}
            />
          )
        }
      </Section>

      {video.join_mode !== JoinMode.FORCED && (
        <Box>
          <Box flex>
            <Section
              items={simpleViewersWithName}
              noItemsTitle={viewersMessage}
              title={intl.formatMessage(messages.otherViewers)}
              forceNoItemsTitle={anonymousViewersCount > 0}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};
