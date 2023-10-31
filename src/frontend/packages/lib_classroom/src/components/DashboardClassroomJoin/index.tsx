import { Typo } from 'lib-components';
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
    <Typo
      className="c__button c__button--primary c__button--medium"
      type="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      aria-label={intl.formatMessage(messages.joinLinkLabel)}
      title={intl.formatMessage(messages.joinLinkLabel)}
      margin="medium"
    >
      {intl.formatMessage(messages.joinLinkLabel)}
    </Typo>
  );
};

export default DashboardClassroomJoin;
