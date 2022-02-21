import { Anchor, Box } from 'grommet';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  joinLinkLabel: {
    defaultMessage: 'Please click here to access meeting.',
    description: 'Label for link used to join a meeting.',
    id: 'component.DashboardMeetingJoin.joinLinkLabel',
  },
});

interface DashboardMeetingJoinProps {
  href: string;
  onClick?: () => void;
}
const DashboardMeetingJoin = ({ href, onClick }: DashboardMeetingJoinProps) => {
  const intl = useIntl();
  return (
    <Box
      align="center"
      justify="center"
      pad="medium"
      round="small"
      margin="medium"
      border={{ color: 'accent-1', size: 'small' }}
      background={{ color: 'accent-1', opacity: 'weak' }}
    >
      <Anchor
        href={href}
        target="_blank"
        rel="noopener"
        onClick={onClick}
        label={intl.formatMessage(messages.joinLinkLabel)}
        color="accent-1"
      />
    </Box>
  );
};

export default DashboardMeetingJoin;
