import { Box } from 'grommet';
import {
  AnonymousUser,
  Loader,
  useCurrentResourceContext,
  useCurrentUser,
  Classroom,
} from 'lib-components';
import React, {
  useState,
  Suspense,
  useRef,
  useEffect,
  lazy,
  useCallback,
} from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { DashboardClassroomError } from 'components/DashboardClassroomError';
import { useJoinClassroomAction, useClassroom } from 'data/queries';

const DashboardClassroomStudent = lazy(
  () => import('components/DashboardClassroomStudent'),
);
const DashboardClassroomInstructor = lazy(
  () => import('components/DashboardClassroomInstructor'),
);
const DashboardClassroomAskUsername = lazy(
  () => import('components/DashboardClassroomAskUsername'),
);
const DashboardClassroomJoin = lazy(
  () => import('components/DashboardClassroomJoin'),
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

interface DashboardClassroomProps {
  classroomId: Classroom['id'];
}

const DashboardClassroom = ({ classroomId }: DashboardClassroomProps) => {
  const intl = useIntl();
  const [context] = useCurrentResourceContext();
  const user = useCurrentUser((state) => state.currentUser);
  const canUpdate = context.permissions.can_update;

  const classroomRefetchInterval = useRef(5000);
  const [classroomUrl, setClassroomUrl] = useState('');
  const [askUsername, setAskUsername] = useState(false);
  const [classroomJoined, setClassroomJoined] = useState(false);
  const [userFullname, setUserFullname] = useState(
    (user && user !== AnonymousUser.ANONYMOUS && user.full_name) || '',
  );

  const { data: classroom, status: useClassroomStatus } = useClassroom(
    classroomId,
    { refetchInterval: classroomRefetchInterval.current },
  );

  const consumerSiteUserId = `${context.consumer_site || ''}_${
    user && user !== AnonymousUser.ANONYMOUS && user.id ? user.id : ''
  }`;

  useEffect(() => {
    if (classroom?.infos?.attendees) {
      const attendeeFound = classroom.infos.attendees.find((attendee) => {
        return (
          consumerSiteUserId === attendee.userID &&
          (attendee.hasVideo === 'true' ||
            attendee.hasJoinedVoice === 'true' ||
            attendee.isListeningOnly === 'true')
        );
      });

      if (attendeeFound) {
        setUserFullname(attendeeFound.fullName);
        setClassroomJoined(true);
        return;
      }
    }

    setClassroomJoined(false);
    setClassroomUrl('');
  }, [classroom?.infos?.attendees, consumerSiteUserId]);

  const joinClassroomMutation = useJoinClassroomAction(classroomId, {
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
  });

  const askUserNameAction = useCallback((isOpen: boolean) => {
    setAskUsername(isOpen);
  }, []);

  const joinClassroomAction = useCallback(() => {
    if (userFullname) {
      askUserNameAction(false);
      joinClassroomMutation.mutate({ fullname: userFullname });
    } else {
      askUserNameAction(true);
    }
  }, [askUserNameAction, joinClassroomMutation, userFullname]);

  const classroomEnded = useCallback(() => {
    setClassroomUrl('');
    askUserNameAction(false);
  }, [askUserNameAction]);

  let content: JSX.Element;
  switch (useClassroomStatus) {
    case 'idle':
    case 'loading':
    default:
      content = (
        <Loader aria-label={intl.formatMessage(messages.loadingClassroom)} />
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
              onCancel={() => askUserNameAction(false)}
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
            classroom={classroom}
            joinedAs={classroomJoined && userFullname}
            joinClassroomAction={joinClassroomAction}
            classroomEnded={classroomEnded}
          />
        );
      } else {
        // Instructor dashboard
        content = (
          <DashboardClassroomInstructor
            classroom={classroom}
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
    <Box align="center">
      <Suspense fallback={<Loader />}>{content}</Suspense>
    </Box>
  );
};

export default DashboardClassroom;
