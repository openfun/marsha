import { Box } from 'grommet';
import { FoldableItem } from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { LivePairingButton } from './LivePairingButton';

const messages = defineMessages({
  title: {
    defaultMessage: 'External broadcast sources',
    description: 'Title used in the external broadcast dashboard widget',
    id: 'components.DashboardLiveControlPane.widgets.LivePairing.title',
  },
  info: {
    defaultMessage:
      'The appairing button allows you to appair an external device and connect you to the current jitsi room.',
    description:
      'Helper explaining what contains the external sources widget and how to use the appairing button',
    id: 'components.DashboardLiveControlPane.widgets.LivePairing.info',
  },
});

export const LivePairing = () => {
  const intl = useIntl();

  return (
    <FoldableItem
      title={intl.formatMessage(messages.title)}
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue={false}
    >
      <Box direction="row" justify="center">
        <LivePairingButton />
      </Box>
    </FoldableItem>
  );
};
