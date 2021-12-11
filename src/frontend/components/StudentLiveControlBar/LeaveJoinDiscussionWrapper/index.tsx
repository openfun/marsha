import React, { useEffect } from 'react';
import { normalizeColor } from 'grommet/utils';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';
import { Redirect, useLocation } from 'react-router-dom';

import { useParticipantWorkflow } from 'data/stores/useParticipantWorkflow';
import { ButtonLayout } from 'components/Button/ButtonLayout';
import { PUBLIC_JITSI_ROUTE } from 'components/PublicVideoLiveJitsi/route';
import { PLAYER_ROUTE } from 'components/routes';
import { StudentJoinDiscussionButton } from 'components/StudentLiveControlButtons/StudentJoinDiscussionButton';
import { StudentLeaveDiscussionButton } from 'components/StudentLiveControlButtons/StudentLeaveDiscussionButton';
import { WaitingJoinDiscussionSVG } from 'components/SVGIcons/WaitingJoinDiscussionSVG';
import { modelName } from 'types/models';
import { theme } from 'utils/theme/theme';

const messages = defineMessages({
  waitingInstructor: {
    defaultMessage: "Waiting for Instructor's response",
    description: `Text that replace the JoinDiscussion button before the instructor response.`,
    id: 'components.StudentJoinDiscussionButton.waitingInstructor',
  },
  rejected: {
    defaultMessage:
      'Your request to join the discussion has not been accepted.',
    description: 'Text to tell participant his/her request is not accepted',
    id: 'components.StudentJoinDiscussionButton.rejected',
  },
});

export const LeaveJoinDiscussionWrapper = () => {
  const intl = useIntl();
  const location = useLocation();
  const { asked, accepted, rejected, reset } = useParticipantWorkflow(
    (state) => ({
      asked: state.asked,
      accepted: state.accepted,
      rejected: state.rejected,
      reset: state.reset,
    }),
  );

  //  if user is rejected : alert user and reset state
  useEffect(() => {
    if (rejected) {
      reset();
      toast.error(intl.formatMessage(messages.rejected));
    }
  }, [rejected, reset]);

  //    if the user is accepted and not currently on stage : redirect him
  if (accepted && location.pathname !== PUBLIC_JITSI_ROUTE()) {
    return <Redirect to={PUBLIC_JITSI_ROUTE()} />;
  }
  //  if the user is not accepted and is not in the live : redirect him
  if (!accepted && location.pathname !== PLAYER_ROUTE(modelName.VIDEOS)) {
    return <Redirect to={PLAYER_ROUTE(modelName.VIDEOS)} />;
  }

  if (asked) {
    return (
      <ButtonLayout
        Icon={WaitingJoinDiscussionSVG}
        label={intl.formatMessage(messages.waitingInstructor)}
        reversedColor={normalizeColor('white', theme)}
        tintColor={normalizeColor('blue-active', theme)}
        textColor={normalizeColor('blue-active', theme)}
      />
    );
  } else if (accepted) {
    return <StudentLeaveDiscussionButton />;
  } else {
    return <StudentJoinDiscussionButton />;
  }
};
