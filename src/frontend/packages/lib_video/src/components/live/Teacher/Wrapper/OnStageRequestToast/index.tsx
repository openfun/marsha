import { colorsTokens } from '@lib-common/cunningham';
import { Button } from '@openfun/cunningham-react';
import { Box, Text } from 'lib-components';
import React from 'react';
import toast from 'react-hot-toast';

import {
  LivePanelItem,
  useLivePanelState,
} from '@lib-video/hooks/useLivePanelState';

interface OnStageRequestToastProps {
  buttonLabel: string;
  message: string;
}

export const ON_STAGE_REQUEST_TOAST_ID = 'onStageRequestToastId';

export const OnStageRequestToast = ({
  buttonLabel,
  message,
}: OnStageRequestToastProps) => {
  const { setPanelVisibility } = useLivePanelState((state) => ({
    setPanelVisibility: state.setPanelVisibility,
  }));

  return (
    <Box background={colorsTokens['primary-100']} round="xsmall" pad="medium">
      <Text type="p">{message}</Text>
      <Button
        aria-label={buttonLabel}
        onClick={() => {
          setPanelVisibility(true, LivePanelItem.VIEWERS_LIST);
          toast.remove(ON_STAGE_REQUEST_TOAST_ID);
        }}
        fullWidth
      >
        {buttonLabel}
      </Button>
    </Box>
  );
};
