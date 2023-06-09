import { FoldableItem } from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import DashboardCopyClipboard from '@lib-classroom/components/DashboardCopyClipboard';
import { useCurrentClassroom } from '@lib-classroom/hooks/useCurrentClassroom';

const messages = defineMessages({
  title: {
    defaultMessage: 'Invite',
    description: 'A title for the widget.',
    id: 'component.ClassroomWidgetProvider.Invite.invite',
  },
  info: {
    defaultMessage: `This widget provides several links depending on what you want to do:
    - Invite link: Invite people to participate to this classroom as guest without any account.
    - LTI link: Special link used to add this classroom in your favorite LMS and have it in a 
    course activity.
    `,
    description: 'Helptext for the widget.',
    id: 'component.ClassroomWidgetProvider.Invite.info',
  },
});

export const Invite = () => {
  const classroom = useCurrentClassroom();
  const intl = useIntl();

  return (
    <FoldableItem
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue
      title={intl.formatMessage(messages.title)}
    >
      <DashboardCopyClipboard
        inviteToken={classroom.public_token}
        instructorToken={classroom.instructor_token}
        classroomId={classroom.id}
      />
    </FoldableItem>
  );
};
