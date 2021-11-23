import React from 'react';
import { withRouter } from 'react-router';
import { Box, Button, Paragraph } from 'grommet';
import { defineMessages, useIntl } from 'react-intl';
import { normalizeColor } from 'grommet/utils';

import { converse } from 'utils/window';
import { PLAYER_ROUTE } from 'components/routes';
import { modelName } from 'types/models';
import { useParticipantWorkflow } from 'data/stores/useParticipantWorkflow';
import { JoinDiscussionSVG } from 'components/SVGIcons/JoinDiscussionSVG';

import { theme } from 'utils/theme/theme';

const messages = defineMessages({
  leaveDiscussion: {
    defaultMessage: 'Leave discussion',
    description: 'Title for the leave discussion button',
    id: 'components.StudentLeaveDiscussionButton.leaveDiscussion',
  },
});

export const StudentLeaveDiscussionButton = withRouter(({ history }) => {
  const reset = useParticipantWorkflow((state) => state.reset);
  const intl = useIntl();

  const leaveDiscussion = () => {
    converse.participantLeaves();
    reset();
    history.push(PLAYER_ROUTE(modelName.VIDEOS));
  };

  return (
    <Box align="center" direction="column">
      <Button
        a11yTitle={intl.formatMessage(messages.leaveDiscussion)}
        icon={
          <JoinDiscussionSVG
            backgroundColor="none"
            baseColor={normalizeColor('active', theme)}
            title={intl.formatMessage(messages.leaveDiscussion)}
            width={'54'}
            height={'54'}
          />
        }
        margin={{ bottom: '6px' }}
        onClick={leaveDiscussion}
        style={{ padding: '0', textAlign: 'center' }}
      />
      <Paragraph color="blue-active" margin="none" size="12px">
        {intl.formatMessage(messages.leaveDiscussion)}
      </Paragraph>
    </Box>
  );
});
