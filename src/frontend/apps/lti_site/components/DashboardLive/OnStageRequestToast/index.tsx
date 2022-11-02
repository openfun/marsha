import { Box, Button, Text } from 'grommet';
import React from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import {
  useLivePanelState,
  LivePanelItem,
} from 'data/stores/useLivePanelState';
import { Participant } from 'lib-components';
import { onStageRequestMessage } from 'utils/onStageRequestMessage';

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
    <Box
      background="bg-info"
      direction="column"
      gap="small"
      round="xsmall"
      pad="medium"
    >
      <Text color="blue-active" size="0.875rem">
        {onStageRequestMessage(participantsList, intl)}
      </Text>

      <Button
        primary
        label={intl.formatMessage(messages.manageRequestBtnLabel)}
        onClick={() => {
          setPanelVisibility(true, LivePanelItem.VIEWERS_LIST);
          toast.remove(ON_STAGE_REQUEST_TOAST_ID);
        }}
        size="small"
      />
    </Box>
  );
};
