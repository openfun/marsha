import { Box } from 'grommet';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { Video } from 'types/tracks';
import { DashboardVideoLivePairing } from 'components/DashboardVideoLivePairing';
import { DashboardVideoLiveWidgetTemplate } from 'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetTemplate';

const messages = defineMessages({
  title: {
    defaultMessage: 'External broadcast sources',
    description: 'Title used in the external broadcast dashboard widget',
    id: 'components.DashboardVideoLiveControlPane.widgets.DashboardVideoLiveWidgetLiePairing.title',
  },
  info: {
    defaultMessage:
      'The appairing button allows you to appair an external device and connect you to the current jitsi room.',
    description:
      'Helper explaining what contains the external sources widget and how to use the appairing button',
    id: 'components.DashboardVideoLiveControlPane.widgets.DashboardVideoLiveWidgetLiePairing.info',
  },
});

interface DashboardVideoLiveWidgetLivePairingProps {
  video: Video;
}

export const DashboardVideoLiveWidgetLivePairing = ({
  video,
}: DashboardVideoLiveWidgetLivePairingProps) => {
  const intl = useIntl();
  return (
    <DashboardVideoLiveWidgetTemplate
      title={intl.formatMessage(messages.title)}
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue={false}
    >
      <Box direction={'row'} justify={'center'}>
        <DashboardVideoLivePairing video={video} />
      </Box>
    </DashboardVideoLiveWidgetTemplate>
  );
};
