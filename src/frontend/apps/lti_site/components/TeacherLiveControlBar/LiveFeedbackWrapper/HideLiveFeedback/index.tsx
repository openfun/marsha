import { Button, ChannelSVG } from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  title: {
    defaultMessage: 'Hide live feedback',
    description:
      'Title for the button in actions during a live in raw mode for a teacher to hide his live feedback.',
    id: 'component.HideLiveFeedback.title',
  },
  label: {
    defaultMessage: 'Live feedback',
    description:
      'Label for the button in actions during a live in raw mode for a teacher to hide his live feedback.',
    id: 'component.HideLiveFeedback.label',
  },
});

interface HideLiveFeedbackProps {
  hideLive: () => void;
}

export const HideLiveFeedback = ({ hideLive }: HideLiveFeedbackProps) => {
  const intl = useIntl();

  return (
    <Button
      label={intl.formatMessage(messages.label)}
      Icon={ChannelSVG}
      onClick={hideLive}
      reversed
      title={intl.formatMessage(messages.title)}
    />
  );
};
