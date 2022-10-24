import { Box, Grommet, Spinner, ThemeType } from 'grommet';
import { deepMerge } from 'grommet/utils';
import { Maybe } from 'lib-common';
import {
  AnonymousUser,
  Loader,
  useCurrentResourceContext,
  useCurrentUser,
  Attendee,
} from 'lib-components';
import React, { lazy, useState, Suspense, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { theme } from 'utils/theme/theme';

import { classroomAppData } from 'apps/classroom/data/classroomAppData';
import { useJoinClassroomAction, useClassroom } from 'lib-classroom';
import { DashboardClassroomError } from 'apps/classroom/components/DashboardClassroomError';

const DashboardClassroomStudent = lazy(
  () => import('apps/classroom/components/DashboardClassroomStudent'),
);
const DashboardClassroomInstructor = lazy(
  () => import('apps/classroom/components/DashboardClassroomInstructor'),
);
const DashboardClassroomAskUsername = lazy(
  () => import('apps/classroom/components/DashboardClassroomAskUsername'),
);
const DashboardClassroomJoin = lazy(
  () => import('apps/classroom/components/DashboardClassroomJoin'),
);

const messages = defineMessages({
  loadingClassroom: {
    defaultMessage: 'Loading classroom...',
    description:
      'Accessible message for the spinner while loading the classroom in dashboard view.',
    id: 'component.DashboardClassroom.loadingClassroom',
  },
  startClassroomSuccess: {
    defaultMessage: 'Classroom started.',
    description: 'Message when classroom start is successful.',
    id: 'component.DashboardClassroom.startClassroomSuccess',
  },
  startClassroomFail: {
    defaultMessage: 'Classroom not started!',
    description: 'Message when classroom start failed.',
    id: 'component.DashboardClassroom.startClassroomFail',
  },
});

const bbbTheme: ThemeType = deepMerge(theme, {
  box: {
    extend: null,
  },
  button: {
    default: {
      background: { color: 'white' },
      border: { color: 'brand', size: 'xsmall' },
      color: 'brand',
      padding: { vertical: 'xsmall', horizontal: 'small' },
    },
    primary: {
      background: { color: 'brand' },
      border: undefined,
      color: 'white',
    },
    border: {
      radius: '4px',
    },
    size: {
      large: {
        border: {
          radius: '6px',
        },
        pad: {
          horizontal: '3rem',
          vertical: '1rem',
        },
      },
    },
    extend: null,
  },
  formField: {
    label: {
      size: '0.8rem',
      margin: '0.5rem 1rem 0',
      color: 'bg-grey',
    },
    border: {
      position: 'outer',
      side: 'all',
      color: 'blue-active',
      style: 'solid',
    },
    round: {
      size: 'xsmall',
    },
  },
  textInput: {
    extend: 'padding: 0 1rem 0.8rem',
  },
  maskedInput: {
    extend: 'padding: 0 1rem 0.8rem',
  },
  dateInput: {
    icon: {
      size: '18px',
    },
  },
});

const DashboardClassroom = () => {
  const intl = useIntl();
  const [context] = useCurrentResourceContext();
  const user = useCurrentUser((state) => state.currentUser);
  const canUpdate = context.permissions.can_update;

  const classroomRefetchInterval = useRef(5000);
  const [classroomUrl, setClassroomUrl] = useState('');
  const [askUsername, setAskUsername] = useState(false);
  const [classroomJoined, setClassroomJoined] = useState(false);
  const [userFullname, setUserFullname] = useState(
    (user && user !== AnonymousUser.ANONYMOUS && user.user_fullname) || '',
  );

  const { data: classroom, status: useClassroomStatus } = useClassroom(
    classroomAppData.classroom!.id,
    { refetchInterval: classroomRefetchInterval.current },
  );

  const consumerSiteUserId = `${context.consumer_site}_${
    user && user !== AnonymousUser.ANONYMOUS ? user.id : ''
  }`;

  useEffect(() => {
    let attendeeFound: Maybe<Attendee>;
    if (classroom?.infos?.attendees) {
      attendeeFound = classroom.infos.attendees?.find((attendee) => {
        return (
          consumerSiteUserId === attendee.userID &&
          (attendee.hasVideo === 'true' ||
            attendee.hasJoinedVoice === 'true' ||
            attendee.isListeningOnly === 'true')
        );
      });
    }

    if (attendeeFound) {
      setUserFullname(attendeeFound.fullName);
      setClassroomJoined(true);
    } else {
      setClassroomJoined(false);
      setClassroomUrl('');
    }
  }, [classroom]);

  const joinClassroomMutation = useJoinClassroomAction(
    classroomAppData.classroom!.id,
    {
      onSuccess: (data) => {
        const openedWindow = window.open(data.url, '_blank');
        if (!openedWindow) {
          setClassroomUrl(data.url);
        }

        // stop classroom polling for students
        if (!canUpdate) {
          classroomRefetchInterval.current = 0;
        }
      },
      onError: () => {
        toast.error(intl.formatMessage(messages.startClassroomFail));
      },
    },
  );

  const openAskUserNameAction = () => {
    setAskUsername(true);
  };
  const closeAskUserNameAction = () => {
    setAskUsername(false);
  };
  const joinClassroomAction = () => {
    if (userFullname) {
      closeAskUserNameAction();
      joinClassroomMutation.mutate({ fullname: userFullname });
    } else {
      openAskUserNameAction();
    }
  };

  const classroomEnded = () => {
    setClassroomUrl('');
    closeAskUserNameAction();
  };

  let content: JSX.Element;
  switch (useClassroomStatus) {
    case 'idle':
    case 'loading':
      content = (
        <Spinner size="large">
          <FormattedMessage {...messages.loadingClassroom} />
        </Spinner>
      );
      break;

    case 'error':
      content = <DashboardClassroomError />;
      break;

    case 'success':
      if (askUsername) {
        // When joining a classroom and user fullname is missing
        if (canUpdate) {
          // Instructors can cancel joining a classroom
          content = (
            <DashboardClassroomAskUsername
              userFullname={userFullname}
              setUserFullname={setUserFullname}
              onJoin={joinClassroomAction}
              onCancel={closeAskUserNameAction}
            />
          );
        } else {
          // Students can not cancel joining a classroom
          content = (
            <DashboardClassroomAskUsername
              userFullname={userFullname}
              setUserFullname={setUserFullname}
              onJoin={joinClassroomAction}
            />
          );
        }
      } else if (!canUpdate) {
        // Student dashboard
        content = (
          <DashboardClassroomStudent
            classroom={classroom!}
            joinedAs={classroomJoined && userFullname}
            joinClassroomAction={joinClassroomAction}
            classroomEnded={classroomEnded}
          />
        );
      } else {
        // Instructor dashboard
        content = (
          <DashboardClassroomInstructor
            classroom={classroom!}
            joinedAs={classroomJoined && userFullname}
            joinClassroomAction={joinClassroomAction}
            classroomEnded={classroomEnded}
          />
        );
      }

      if (!classroomJoined && classroomUrl && classroom?.started) {
        // When user is not in the classroom,
        // classroom url is appended to current dashboard
        content = (
          <React.Fragment>
            {content}
            <DashboardClassroomJoin href={classroomUrl} />
          </React.Fragment>
        );
      }
      break;
  }

  return (
    <Grommet theme={bbbTheme}>
      <Box align="center">
        <Suspense fallback={<Loader />}>{content}</Suspense>
      </Box>
    </Grommet>
  );
};

export default DashboardClassroom;
