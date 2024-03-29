import { Button } from '@openfun/cunningham-react';
import { FormCheckmark, FormClose } from 'grommet-icons';
import { Box, BoxLoader, PortabilityRequest } from 'lib-components';
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
    return <BoxLoader size="small" />;
  }

  if (!displayButtons) {
    // hide button when query succeed but query not updated yet
    return <Fragment />;
  }

  return (
    <Box direction="row" gap="small">
      <Button
        aria-label={intl.formatMessage(messages.acceptPortabilityRequest)}
        color="primary"
        icon={<FormCheckmark color="white" />}
        onClick={() => mutateAcceptPortabilityRequest({})}
        className="c__button--success"
      />
      <Button
        aria-label={intl.formatMessage(messages.rejectPortabilityRequest)}
        color="danger"
        icon={<FormClose color="white" />}
        onClick={() => mutateRejectPortabilityRequest({})}
      />
    </Box>
  );
};
