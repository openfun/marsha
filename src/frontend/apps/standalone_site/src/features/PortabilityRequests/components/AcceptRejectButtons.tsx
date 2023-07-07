import { Box, Button } from 'grommet';
import { FormCheckmark, FormClose } from 'grommet-icons';
import { PortabilityRequest, Spinner } from 'lib-components';
import { Fragment, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import {
  acceptPortabilityRequest,
  rejectPortabilityRequest,
} from '../api/usePortabilityRequests';

const messages = defineMessages({
  actionFailed: {
    defaultMessage: 'The requested action has failed please try again',
    description:
      'Displayed error when the API request failed (for both accept or reject)',
    id: 'features.PortabilityRequests.ItemTableRow.actionFailed',
  },
  acceptPortabilityRequest: {
    defaultMessage: 'Accept',
    description: 'Accessibility text for portability request accept button',
    id: 'features.PortabilityRequests.ItemTableRow.acceptPortabilityRequest',
  },
  rejectPortabilityRequest: {
    defaultMessage: 'Reject',
    description: 'Accessibility text for portability request reject button',
    id: 'features.PortabilityRequests.ItemTableRow.rejectPortabilityRequest',
  },
});

interface AcceptRejectButtonsProps {
  portabilityRequestId: PortabilityRequest['id'];
  canAcceptOrReject: PortabilityRequest['can_accept_or_reject'];
}

export const AcceptRejectButtons = ({
  portabilityRequestId,
  canAcceptOrReject,
}: AcceptRejectButtonsProps) => {
  const intl = useIntl();
  const [displayButtons, setDisplayButtons] = useState(canAcceptOrReject);

  useEffect(() => {
    setDisplayButtons(canAcceptOrReject);
  }, [canAcceptOrReject]);

  const {
    mutate: mutateAcceptPortabilityRequest,
    isLoading: isLoadingAcceptPortabilityRequest,
  } = acceptPortabilityRequest(portabilityRequestId, {
    onError: () => {
      toast.error(intl.formatMessage(messages.actionFailed));
      setDisplayButtons(true);
    },
    onMutate: () => {
      setDisplayButtons(false);
    },
  });

  const {
    mutate: mutateRejectPortabilityRequest,
    isLoading: isLoadingRejectPortabilityRequest,
  } = rejectPortabilityRequest(portabilityRequestId, {
    onError: () => {
      toast.error(intl.formatMessage(messages.actionFailed));
      setDisplayButtons(true);
    },
    onMutate: () => {
      setDisplayButtons(false);
    },
  });

  if (isLoadingRejectPortabilityRequest || isLoadingAcceptPortabilityRequest) {
    return <Spinner size="small" />;
  }

  if (!displayButtons) {
    // hide button when query succeed but query not updated yet
    return <Fragment />;
  }

  return (
    <Box direction="row" gap="small">
      <Button
        primary
        pad={{ horizontal: 'small', vertical: 'xsmall' }}
        alignSelf="center"
        a11yTitle={intl.formatMessage(messages.acceptPortabilityRequest)}
        color="status-ok"
        icon={<FormCheckmark color="white" />}
        onClick={() => mutateAcceptPortabilityRequest({})}
      />
      <Button
        primary
        pad={{ horizontal: 'small', vertical: 'xsmall' }}
        alignSelf="center"
        a11yTitle={intl.formatMessage(messages.rejectPortabilityRequest)}
        color="status-error"
        icon={<FormClose color="white" />}
        onClick={() => mutateRejectPortabilityRequest({})}
      />
    </Box>
  );
};
