import { Box, Text } from 'grommet';
import React, { lazy, Suspense } from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { DashboardButton } from 'components/DashboardPaneButtons/DashboardButtons';

import { Meeting } from 'apps/bbb/types/models';

import { bbbAppData } from 'apps/bbb/data/bbbAppData';
import { useEndMeeting } from 'apps/bbb/data/queries';
import { Loader } from '../../../components/Loader';
const DashboardMeetingForm = lazy(
  () => import('apps/bbb/DashboardMeetingForm'),
);
const DashboardMeetingInfos = lazy(
  () => import('apps/bbb/DashboardMeetingInfos'),
);

const messages = defineMessages({
  joinedAs: {
    defaultMessage: 'You have joined the meeting as {joinedAs}.',
    description: 'Message when user has joined the meeting.',
    id: 'component.DashboardMeetingInstructor.joinedAs',
  },
  joinMeetingLabel: {
    defaultMessage: 'Join meeting',
    description: 'Label for joining meeting in instructor dashboard.',
    id: 'component.DashboardMeetingInstructor.joinMeetingLabel',
  },
  endingMeetingPending: {
    defaultMessage: 'Ending meeting…',
    description: 'Message when ending meeting is pending.',
    id: 'component.DashboardMeetingInstructor.endingMeetingPending',
  },
  endMeetingLabel: {
    defaultMessage: 'End meeting',
    description: 'Label for ending meeting in instructor dashboard.',
    id: 'component.DashboardMeetingInstructor.endMeetingLabel',
  },
  createMeetingFail: {
    defaultMessage: 'Meeting not created!',
    description: 'Message when meeting creation failed.',
    id: 'component.DashboardMeetingInstructor.createMeetingFail',
  },
});

interface DashboardMeetingInstructorProps {
  meeting: Meeting;
  joinedAs: string | false;
  joinMeetingAction: () => void;
  meetingEnded: () => void;
}

const DashboardMeetingInstructor = ({
  meeting,
  joinedAs,
  joinMeetingAction,
  meetingEnded,
}: DashboardMeetingInstructorProps) => {
  const intl = useIntl();

  const endMeetingMutation = useEndMeeting(bbbAppData.meeting!.id, {
    onSuccess: () => {
      toast.success(intl.formatMessage(messages.endingMeetingPending));
      meetingEnded();
    },
    onError: () => {
      toast.error(intl.formatMessage(messages.createMeetingFail));
    },
  });

  const endMeetingAction = () => {
    endMeetingMutation.mutate({});
  };

  return (
    <Box pad="large">
      <Suspense fallback={<Loader />}>
        {joinedAs && (
          <Text textAlign="center" margin={{ bottom: 'medium' }}>
            <FormattedMessage {...messages.joinedAs} values={{ joinedAs }} />
          </Text>
        )}
        {!meeting.started ? (
          <DashboardMeetingForm meeting={meeting} />
        ) : (
          <React.Fragment>
            <DashboardMeetingInfos infos={meeting.infos} />
            <Box direction="row" justify="center" margin={{ top: 'medium' }}>
              <DashboardButton
                label={intl.formatMessage(messages.endMeetingLabel)}
                onClick={endMeetingAction}
              />
              {!joinedAs && (
                <DashboardButton
                  primary={true}
                  label={intl.formatMessage(messages.joinMeetingLabel)}
                  onClick={joinMeetingAction}
                />
              )}
            </Box>
          </React.Fragment>
        )}
      </Suspense>
    </Box>
  );
};

export default DashboardMeetingInstructor;
