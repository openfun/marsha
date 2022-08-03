import { Box } from 'grommet';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { DashboardLivePairing } from 'components/DashboardLivePairing';
import { WidgetTemplate } from 'components/common/dashboard/widgets/WidgetTemplate';

const messages = defineMessages({
  title: {
    defaultMessage: 'External broadcast sources',
    description: 'Title used in the external broadcast dashboard widget',
    id: 'components.DashboardLiveControlPane.widgets.DashboardLiveWidgetLiePairing.title',
  },
  info: {
    defaultMessage:
      'The appairing button allows you to appair an external device and connect you to the current jitsi room.',
    description:
      'Helper explaining what contains the external sources widget and how to use the appairing button',
    id: 'components.DashboardLiveControlPane.widgets.DashboardLiveWidgetLiePairing.info',
  },
});

export const DashboardLiveWidgetLivePairing = () => {
  const intl = useIntl();

  return (
    <WidgetTemplate
      title={intl.formatMessage(messages.title)}
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue={false}
    >
      <Box direction={'row'} justify={'center'}>
        <DashboardLivePairing />
      </Box>
    </WidgetTemplate>
  );
};
