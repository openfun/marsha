import { Anchor, Box } from 'grommet';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  joinLinkLabel: {
    defaultMessage: 'Please click here to access classroom.',
    description: 'Label for link used to join a classroom.',
    id: 'component.DashboardClassroomJoin.joinLinkLabel',
  },
});

interface DashboardClassroomJoinProps {
  href: string;
  onClick?: () => void;
}
const DashboardClassroomJoin = ({
  href,
  onClick,
}: DashboardClassroomJoinProps) => {
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

export default DashboardClassroomJoin;
