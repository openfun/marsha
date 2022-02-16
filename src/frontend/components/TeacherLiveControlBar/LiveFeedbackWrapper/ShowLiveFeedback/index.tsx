import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { Button } from 'components/Button';
import { ChannelSVG } from 'components/SVGIcons/ChannelSVG';

const messages = defineMessages({
  title: {
    defaultMessage: 'Show live feedback',
    description:
      'Title for the button in actions during a live in raw mode for a teacher to show his live feedback.',
    id: 'component.ShowLiveFeedback.title',
  },
  label: {
    defaultMessage: 'Live feedback',
    description:
      'Label for the button in actions during a live in raw mode for a teacher to show his live feedback.',
    id: 'component.ShowLiveFeedback.label',
  },
});

interface ShowLiveFeedbackProps {
  showLive: () => void;
}

export const ShowLiveFeedback = ({ showLive }: ShowLiveFeedbackProps) => {
  const intl = useIntl();

  return (
    <Button
      label={intl.formatMessage(messages.label)}
      Icon={ChannelSVG}
      onClick={showLive}
      title={intl.formatMessage(messages.title)}
    />
  );
};
