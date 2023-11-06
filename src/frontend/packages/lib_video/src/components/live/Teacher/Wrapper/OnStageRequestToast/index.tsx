import { colorsTokens } from '@lib-common/cunningham';
import { Button } from '@openfun/cunningham-react';
import { Box, Participant, Text } from 'lib-components';
import React from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import {
  LivePanelItem,
  useLivePanelState,
} from '@lib-video/hooks/useLivePanelState';
import { onStageRequestMessage } from '@lib-video/utils/onStageRequestMessage';

const messages = defineMessages({
  manageRequestBtnLabel: {
    defaultMessage: 'Manage requests',
    description:
      'Label of the button used for opening the manage on-stage request tab.',
    id: 'component.DashboardLive.manageRequestBtnLabel',
  },
});

interface OnStageRequestToastProps {
  participantsList: Participant[];
}

export const ON_STAGE_REQUEST_TOAST_ID = 'onStageRequestToastId';

export const OnStageRequestToast = ({
  participantsList,
}: OnStageRequestToastProps) => {
  const intl = useIntl();
  const { setPanelVisibility } = useLivePanelState((state) => ({
    setPanelVisibility: state.setPanelVisibility,
  }));

  return (
    <Box background={colorsTokens['primary-100']} round="xsmall" pad="medium">
      <Text type="p">{onStageRequestMessage(participantsList, intl)}</Text>
      <Button
        aria-label={intl.formatMessage(messages.manageRequestBtnLabel)}
        onClick={() => {
          setPanelVisibility(true, LivePanelItem.VIEWERS_LIST);
          toast.remove(ON_STAGE_REQUEST_TOAST_ID);
        }}
        fullWidth
      >
        {intl.formatMessage(messages.manageRequestBtnLabel)}
      </Button>
    </Box>
  );
};
