import { CircleInformation } from 'grommet-icons';
import { Box, List, Text } from 'grommet';
import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap.css';
import React from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { Video } from '../../types/tracks';

const messages = defineMessages({
  copied: {
    defaultMessage: 'Copied!',
    description: 'Message displayed when endpoints info are copied.',
    id: 'components.DashboardVideoLiveInfo.copied',
  },
  liveInfo: {
    defaultMessage:
      'You want to use an external streaming source, find the RTMP adresses here',
    description: 'Message that displays live rtmp information',
    id: 'components.DashboardVideoLiveInfo.liveInfo',
  },
});

interface DashboardVideoLiveInfoProps {
  video: Video;
}

export const DashboardVideoLiveInfo = ({
  video,
}: DashboardVideoLiveInfoProps) => {
  const intl = useIntl();

  const TipContent = (
    <Box>
      <List
        data={video.live_info.medialive?.input.endpoints}
        onClickItem={(event: { item?: string }) => {
          navigator.clipboard.writeText(event.item!).then(() => {
            toast.success(intl.formatMessage(messages.copied));
          });
        }}
      />
    </Box>
  );

  return (
    <React.Fragment>
      <Text>{intl.formatMessage(messages.liveInfo)}</Text>&nbsp;
      <Tooltip overlay={TipContent}>
        <CircleInformation />
      </Tooltip>
    </React.Fragment>
  );
};
