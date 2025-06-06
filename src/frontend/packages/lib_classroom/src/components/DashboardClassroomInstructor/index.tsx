import { Button } from '@openfun/cunningham-react';
import { Breakpoints, Nullable } from 'lib-common';
import { Box, BoxLoader, Classroom, Grid, useResponsive } from 'lib-components';
import React, { JSX, Suspense, lazy } from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import {
  DashboardClassroomLayout,
  DashboardClassroomMessage,
} from '@lib-classroom/components/DashboardClassroomLayout';
import { useEndClassroomAction } from '@lib-classroom/data/queries';

const DashboardClassroomForm = lazy(
  () => import('@lib-classroom/components/DashboardClassroomForm'),
);
const DashboardClassroomInfos = lazy(
  () => import('@lib-classroom/components/DashboardClassroomInfos'),
);

const messages = defineMessages({
  joinedAs: {
    defaultMessage: 'You have joined the classroom as {joinedAs}.',
    description: 'Message when user has joined the classroom.',
    id: 'component.DashboardClassroomInstructor.joinedAs',
  },
  joinClassroomLabel: {
    defaultMessage: 'Join classroom',
    description: 'Label for joining classroom in instructor dashboard.',
    id: 'component.DashboardClassroomInstructor.joinClassroomLabel',
  },
  endingClassroomPending: {
    defaultMessage: 'Ending classroom…',
    description: 'Message when ending classroom is pending.',
    id: 'component.DashboardClassroomInstructor.endingClassroomPending',
  },
  endClassroomLabel: {
    defaultMessage: 'End classroom',
    description: 'Label for ending classroom in instructor dashboard.',
    id: 'component.DashboardClassroomInstructor.endClassroomLabel',
  },
  createClassroomFail: {
    defaultMessage: 'Classroom not created!',
    description: 'Message when classroom creation failed.',
    id: 'component.DashboardClassroomInstructor.createClassroomFail',
  },
});

interface DashboardClassroomInstructorProps {
  classroom: Classroom;
  joinedAs: string | false;
  joinClassroomAction: () => void;
  classroomEnded: () => void;
}

const DashboardClassroomInstructor = ({
  classroom,
  joinedAs,
  joinClassroomAction,
  classroomEnded,
}: DashboardClassroomInstructorProps) => {
  const intl = useIntl();
  const { breakpoint, isSmallerBreakpoint } = useResponsive();

  const endClassroomMutation = useEndClassroomAction(classroom.id, {
    onSuccess: () => {
      toast.success(intl.formatMessage(messages.endingClassroomPending));
      classroomEnded();
    },
    onError: () => {
      toast.error(intl.formatMessage(messages.createClassroomFail));
    },
  });

  const endClassroomAction = () => {
    endClassroomMutation.mutate({});
  };

  if (!classroom.started) {
    return (
      <Suspense fallback={<BoxLoader />}>
        <DashboardClassroomForm classroom={classroom} />
      </Suspense>
    );
  }

  let left: JSX.Element;
  let right: Nullable<JSX.Element> = null;

  if (joinedAs) {
    left = (
      <React.Fragment>
        <DashboardClassroomMessage
          message={intl.formatMessage(messages.joinedAs, { joinedAs })}
        />
        <DashboardClassroomInfos
          infos={classroom.infos}
          inviteToken={classroom.public_token}
          instructorToken={classroom.instructor_token}
          classroomId={classroom.id}
        />
      </React.Fragment>
    );
    right = (
      <Button
        aria-label={intl.formatMessage(messages.endClassroomLabel)}
        onClick={endClassroomAction}
        fullWidth
      >
        {intl.formatMessage(messages.endClassroomLabel)}
      </Button>
    );
  } else {
    left = (
      <Box margin={{ top: 'large' }}>
        <DashboardClassroomInfos
          infos={classroom.infos}
          inviteToken={classroom.public_token}
          instructorToken={classroom.instructor_token}
          classroomId={classroom.id}
        />
      </Box>
    );
    right = (
      <Grid
        gap="small"
        columns={{
          count: !isSmallerBreakpoint(breakpoint, Breakpoints.large) ? 2 : 1,
          size: 'auto',
        }}
        fill="horizontal"
      >
        <Button
          aria-label={intl.formatMessage(messages.endClassroomLabel)}
          onClick={endClassroomAction}
          fullWidth
          color="secondary"
        >
          {intl.formatMessage(messages.endClassroomLabel)}
        </Button>
        <Button
          aria-label={intl.formatMessage(messages.joinClassroomLabel)}
          onClick={joinClassroomAction}
          fullWidth
        >
          {intl.formatMessage(messages.joinClassroomLabel)}
        </Button>
      </Grid>
    );
  }

  return (
    <Suspense fallback={<BoxLoader />}>
      <DashboardClassroomLayout left={left} right={right} />
    </Suspense>
  );
};

export default DashboardClassroomInstructor;
