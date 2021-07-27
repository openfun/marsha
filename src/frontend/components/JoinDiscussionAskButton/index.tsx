import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Redirect } from 'react-router-dom';

import { useParticipantWorkflow } from '../../data/stores/useParticipantWorkflow';
import { DashboardButton } from '../DashboardPaneButtons/DashboardButtons';

import { converse } from '../../utils/window';
import { PUBLIC_JITSI_ROUTE } from '../PublicVideoLiveJitsi/route';

const messages = defineMessages({
  askInstructor: {
    defaultMessage: 'Send request to join the discussion',
    description: 'Ask the instructor to join the discussion',
    id: 'components.JoinDiscussionAskButton.askInstructor',
  },
  waitingInstructor: {
    defaultMessage: 'Waiting for Instructor response',
    description: `Text that replace the JoinDiscussion button before the instructor response.`,
    id: 'components.JoinDiscussionAskButton.waitingInstructor',
  },
});

export const JoinDiscussionAskButton = () => {
  const { asked, accepted, setAsked } = useParticipantWorkflow((state) => ({
    asked: state.asked,
    accepted: state.accepted,
    setAsked: state.setAsked,
  }));

  const onClick = () => {
    converse.askParticipantToMount();
    setAsked();
  };

  if (accepted) {
    return <Redirect to={PUBLIC_JITSI_ROUTE()} />;
  }

  return asked ? (
    <FormattedMessage {...messages.waitingInstructor} />
  ) : (
    <DashboardButton
      label={<FormattedMessage {...messages.askInstructor} />}
      primary={true}
      onClick={onClick}
    />
  );
};
