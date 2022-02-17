import { Anchor, Box, Paragraph } from 'grommet';
import React from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

const messages = defineMessages({
  blockedPopups: {
    defaultMessage: 'It seems like your browser is blocking popups.',
    description: 'Message when browser is blocking popups.',
    id: 'component.DashboardMeetingJoin.blockedPopups',
  },
  joinLinkLabel: {
    defaultMessage: 'Please click here to access meeting.',
    description: 'Label for link used to join a meeting.',
    id: 'component.DashboardMeetingJoin.joinLinkLabel',
  },
});

interface DashboardMeetingJoinProps {
  href: string;
  onClick: () => void;
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
      <Paragraph margin="none">
        <FormattedMessage {...messages.blockedPopups} />
      </Paragraph>
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
