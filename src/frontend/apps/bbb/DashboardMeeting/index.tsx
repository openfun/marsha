import { Box, Spinner } from 'grommet';
import React, { lazy, useState, Suspense, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { ErrorMessage } from 'components/ErrorComponents';
import { getDecodedJwt } from 'data/appData';
import { Loader } from 'components/Loader';

import { bbbAppData } from 'apps/bbb/data/bbbAppData';
import { useJoinMeeting, useMeeting } from 'apps/bbb/data/queries';
import { Attendee } from 'apps/bbb/types/models';
import { Maybe } from 'utils/types';

const DashboardMeetingStudent = lazy(
  () => import('apps/bbb/DashboardMeetingStudent'),
);
const DashboardMeetingInstructor = lazy(
  () => import('apps/bbb/DashboardMeetingInstructor'),
);
const DashboardMeetingAskUsername = lazy(
  () => import('apps/bbb/DashboardMeetingAskUsername'),
);
const DashboardMeetingJoin = lazy(
  () => import('apps/bbb/DashboardMeetingJoin'),
);

const messages = defineMessages({
  loadingMeeting: {
    defaultMessage: 'Loading meeting...',
    description:
      'Accessible message for the spinner while loading the meeting in dashboard view.',
    id: 'component.DashboardMeeting.loadingMeeting',
  },
  startMeetingSuccess: {
    defaultMessage: 'Meeting started.',
    description: 'Message when meeting start is successful.',
    id: 'component.DashboardMeeting.startMeetingSuccess',
  },
  startMeetingFail: {
    defaultMessage: 'Meeting not started!',
    description: 'Message when meeting start failed.',
    id: 'component.DashboardMeeting.startMeetingFail',
  },
});

const DashboardMeeting = () => {
  const intl = useIntl();
  const canUpdate = getDecodedJwt().permissions.can_update;

  const meetingRefetchInterval = useRef(5000);
  const [meetingUrl, setMeetingUrl] = useState('');
  const [askUsername, setAskUsername] = useState(false);
  const [meetingJoined, setMeetingJoined] = useState(false);
  const [userFullname, setUserFullname] = useState(
    getDecodedJwt().user?.user_fullname || '',
  );

  const { data: meeting, status: useMeetingStatus } = useMeeting(
    bbbAppData.meeting!.id,
    { refetchInterval: meetingRefetchInterval.current },
  );

  const consumerSiteUserId = `${getDecodedJwt().consumer_site}_${
    getDecodedJwt().user?.id
  }`;

  useEffect(() => {
    let attendeeFound: Maybe<Attendee>;
    if (meeting?.infos?.attendees) {
      attendeeFound = meeting.infos.attendees?.find((attendee) => {
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
      setMeetingJoined(true);
    } else {
      setMeetingJoined(false);
      setMeetingUrl('');
    }
  }, [meeting]);

  const joinMeetingMutation = useJoinMeeting(bbbAppData.meeting!.id, {
    onSuccess: (data) => {
      const openedWindow = window.open(data.url, '_blank');
      if (!openedWindow) {
        setMeetingUrl(data.url);
      }

      // stop meeting polling for students
      if (!canUpdate) {
        meetingRefetchInterval.current = 0;
      }
    },
    onError: () => {
      toast.error(intl.formatMessage(messages.startMeetingFail));
    },
  });

  const openAskUserNameAction = () => {
    setAskUsername(true);
  };
  const closeAskUserNameAction = () => {
    setAskUsername(false);
  };
  const joinMeetingAction = () => {
    if (userFullname) {
      closeAskUserNameAction();
      joinMeetingMutation.mutate({ fullname: userFullname });
    } else {
      openAskUserNameAction();
    }
  };

  const meetingEnded = () => {
    setMeetingUrl('');
    closeAskUserNameAction();
  };

  let content: JSX.Element;
  switch (useMeetingStatus) {
    case 'idle':
    case 'loading':
      content = (
        <Spinner size="large">
          <FormattedMessage {...messages.loadingMeeting} />
        </Spinner>
      );
      break;

    case 'error':
      content = <ErrorMessage code="generic" />;
      break;

    case 'success':
      if (askUsername) {
        // When joining a meeting and user fullname is missing
        if (canUpdate) {
          // Instructors can cancel joining a meeting
          content = (
            <DashboardMeetingAskUsername
              userFullname={userFullname}
              setUserFullname={setUserFullname}
              onJoin={joinMeetingAction}
              onCancel={closeAskUserNameAction}
            />
          );
        } else {
          // Students can not cancel joining a meeting
          content = (
            <DashboardMeetingAskUsername
              userFullname={userFullname}
              setUserFullname={setUserFullname}
              onJoin={joinMeetingAction}
            />
          );
        }
      } else if (!canUpdate) {
        // Student dashboard
        content = (
          <DashboardMeetingStudent
            meeting={meeting!}
            joinedAs={meetingJoined && userFullname}
            joinMeetingAction={joinMeetingAction}
            meetingEnded={meetingEnded}
          />
        );
      } else {
        // Instructor dashboard
        content = (
          <DashboardMeetingInstructor
            meeting={meeting!}
            joinedAs={meetingJoined && userFullname}
            joinMeetingAction={joinMeetingAction}
            meetingEnded={meetingEnded}
          />
        );
      }

      if (!meetingJoined && meetingUrl && meeting?.started) {
        // When user is not in the meeting,
        // meeting url is appended to current dashboard
        content = (
          <React.Fragment>
            {content}
            <DashboardMeetingJoin href={meetingUrl} />
          </React.Fragment>
        );
      }
      break;
  }

  return (
    <Box align="center" pad={{ top: 'small' }}>
      <Suspense fallback={<Loader />}>{content}</Suspense>
    </Box>
  );
};

export default DashboardMeeting;
