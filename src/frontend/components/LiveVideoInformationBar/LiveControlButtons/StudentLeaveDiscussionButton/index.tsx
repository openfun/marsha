import React from 'react';
import { withRouter } from 'react-router';
import { Button } from 'grommet';
import { defineMessages, useIntl } from 'react-intl';

import { converse } from 'utils/window';
import { PLAYER_ROUTE } from 'components/routes';
import { modelName } from 'types/models';
import { useParticipantWorkflow } from 'data/stores/useParticipantWorkflow';
import { JoinDiscussionSVG } from 'components/SVGIcons/JoinDiscussionSVG';

const messages = defineMessages({
  LeaveDiscussionButton: {
    defaultMessage: 'Leave discussion',
    description: 'Title for the leave discussion button',
    id: 'components.StudentLeaveDiscussionButton.LeaveDiscussionButton',
  },
});

export const StudentLeaveDiscussionButton = withRouter(({ history }) => {
  const reset = useParticipantWorkflow((state) => state.reset);
  const intl = useIntl();

  const onClick = () => {
    converse.participantLeaves();
    reset();
    history.push(PLAYER_ROUTE(modelName.VIDEOS));
  };

  return (
    <Button
      margin={{ right: 'medium', left: 'medium' }}
      onClick={onClick}
      a11yTitle={intl.formatMessage(messages.LeaveDiscussionButton)}
      style={{ padding: '0' }}
      icon={
        <JoinDiscussionSVG
          baseColor={'blue-off'}
          hoverColor={'blue-active'}
          title={intl.formatMessage(messages.LeaveDiscussionButton)}
          width={'33'}
          height={'41.67'}
        />
      }
    />
  );
});
