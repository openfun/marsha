import { Box, Button, Grid } from 'grommet';
import { Breakpoints, Nullable } from 'lib-common';
import { Classroom, useResponsive, Spinner } from 'lib-components';
import React, { lazy, Suspense } from 'react';
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
      <Suspense fallback={<Spinner />}>
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
          inviteToken={classroom.invite_token}
          instructorToken={classroom.instructor_token}
          classroomId={classroom.id}
        />
      </React.Fragment>
    );
    right = (
      <Button
        label={intl.formatMessage(messages.endClassroomLabel)}
        primary
        size="large"
        fill="horizontal"
        onClick={endClassroomAction}
      />
    );
  } else {
    left = (
      <Box margin={{ top: 'large' }}>
        <DashboardClassroomInfos
          infos={classroom.infos}
          inviteToken={classroom.invite_token}
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
          label={intl.formatMessage(messages.endClassroomLabel)}
          size="large"
          fill="horizontal"
          onClick={endClassroomAction}
        />
        <Button
          label={intl.formatMessage(messages.joinClassroomLabel)}
          primary
          size="large"
          fill="horizontal"
          onClick={joinClassroomAction}
        />
      </Grid>
    );
  }

  return (
    <Suspense fallback={<Spinner />}>
      <DashboardClassroomLayout left={left} right={right} />
    </Suspense>
  );
};

export default DashboardClassroomInstructor;
