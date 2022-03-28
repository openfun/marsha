import { Box, Button, ButtonProps } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { StopSVG } from 'components/SVGIcons/StopSVG';
import { useStopLiveConfirmation } from 'data/stores/useStopLiveConfirmation';
import { Video } from 'types/tracks';
import { theme } from 'utils/theme/theme';

const messages = defineMessages({
  title: {
    defaultMessage: 'End live',
    description: 'Title for the button to end streaming as a teacher.',
    id: 'components.DashboardVideoLiveEndButton.endLive',
  },
});

interface StopLiveButtonProps extends ButtonProps {
  video: Video;
}

export const StopLiveButton = ({ video, ...props }: StopLiveButtonProps) => {
  const intl = useIntl();
  const [shouldShowStopAler, setShouldShowStopAlert] =
    useStopLiveConfirmation();

  return (
    <Button
      primary
      color={normalizeColor('red-active', theme)}
      disabled={shouldShowStopAler}
      label={
        <Box flex direction="row" style={{ whiteSpace: 'nowrap' }}>
          {intl.formatMessage(messages.title)}
          <StopSVG
            iconColor="white"
            height="25px"
            width="25px"
            containerStyle={{ margin: 'auto', marginLeft: '8px' }}
          />
        </Box>
      }
      onClick={() => setShouldShowStopAlert(true)}
      {...props}
    />
  );
};
