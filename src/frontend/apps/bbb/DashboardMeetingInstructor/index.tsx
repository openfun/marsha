import { Box, Button, Grid, ResponsiveContext } from 'grommet';
import React, { lazy, Suspense, useContext } from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { Loader } from 'components/Loader';
import { Nullable } from 'utils/types';

import { Meeting } from 'apps/bbb/types/models';
import { bbbAppData } from 'apps/bbb/data/bbbAppData';
import { useEndMeeting } from 'apps/bbb/data/queries';
import {
  DashboardMeetingLayout,
  DashboardMeetingMessage,
} from 'apps/bbb/DashboardMeetingLayout';

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
  const size = useContext(ResponsiveContext);

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

  if (!meeting.started) {
    return (
      <Suspense fallback={<Loader />}>
        <DashboardMeetingForm meeting={meeting} />
      </Suspense>
    );
  }

  let left: JSX.Element;
  let right: Nullable<JSX.Element> = null;

  if (joinedAs) {
    left = (
      <React.Fragment>
        <DashboardMeetingMessage
          message={intl.formatMessage(messages.joinedAs, { joinedAs })}
        />
        <DashboardMeetingInfos infos={meeting.infos} />
      </React.Fragment>
    );
    right = (
      <Button
        label={intl.formatMessage(messages.endMeetingLabel)}
        primary
        size="large"
        fill="horizontal"
        onClick={endMeetingAction}
      />
    );
  } else {
    left = (
      <Box margin={{ top: 'large' }}>
        <DashboardMeetingInfos infos={meeting.infos} />
      </Box>
    );
    right = (
      <Grid
        gap="small"
        columns={{ count: size !== 'medium' ? 2 : 1, size: 'auto' }}
        fill="horizontal"
      >
        <Button
          label={intl.formatMessage(messages.endMeetingLabel)}
          size="large"
          fill="horizontal"
          onClick={endMeetingAction}
        />
        <Button
          label={intl.formatMessage(messages.joinMeetingLabel)}
          primary
          size="large"
          fill="horizontal"
          onClick={joinMeetingAction}
        />
      </Grid>
    );
  }

  return (
    <Suspense fallback={<Loader />}>
      <DashboardMeetingLayout left={left} right={right} />
    </Suspense>
  );
};

export default DashboardMeetingInstructor;
