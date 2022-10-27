import { Box, Button } from 'grommet';
import { FormCheckmark, FormClose } from 'grommet-icons';
import { PortabilityRequest, Spinner } from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import {
  acceptPortabilityRequest,
  rejectPortabilityRequest,
} from '../api/usePortabilityRequests';

import { PortabilityRequestStateTag } from './PortabilityRequestStateTag';

const messages = defineMessages({
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
  requestFromLtiUser: {
    defaultMessage: 'Made by LTI user',
    description:
      'Value displayed in the table when the request is from an LTI user',
    id: 'features.PortabilityRequests.ItemTableRow.requestFromLtiUser',
  },
  rowPortabilityRequestText: {
    defaultMessage: '{from_playlist} wants access to {for_playlist}',
    description:
      'Row text displayed in the table to display the playlists involved in the request',
    id: 'features.PortabilityRequests.ItemTableRow.rowPlaylistText',
  },
});

interface ItemTableRowProps {
  item: PortabilityRequest;
}

const AcceptRejectButtons = ({ item }: ItemTableRowProps) => {
  const intl = useIntl();
  const [displayButtons, setDisplayButtons] = React.useState(
    item.can_accept_or_reject,
  );
  const currentItemId = React.useRef(item.id);

  React.useEffect(() => {
    if (currentItemId.current !== item.id) {
      currentItemId.current = item.id;
      setDisplayButtons(item.can_accept_or_reject);
    }
  }, [item.id, item.can_accept_or_reject]);

  const {
    mutate: mutateAcceptPortabilityRequest,
    isLoading: isLoadingAcceptPortabilityRequest,
  } = acceptPortabilityRequest(item.id, {
    onSuccess: () => {
      setDisplayButtons(false);
    },
  });

  const {
    mutate: mutateRejectPortabilityRequest,
    isLoading: isLoadingRejectPortabilityRequest,
  } = rejectPortabilityRequest(item.id, {
    onSuccess: () => {
      setDisplayButtons(false);
    },
  });

  if (isLoadingRejectPortabilityRequest || isLoadingAcceptPortabilityRequest) {
    return <Spinner size="small" />;
  }

  if (!displayButtons) {
    // hide button when query succeed but query not updated yet
    return <React.Fragment />;
  }

  return (
    <Box direction="row" gap="small">
      <Button
        primary
        alignSelf="center"
        a11yTitle={intl.formatMessage(messages.acceptPortabilityRequest)}
        color="status-ok"
        icon={<FormCheckmark color="white" />}
        onClick={() => mutateAcceptPortabilityRequest({})}
      />
      <Button
        primary
        alignSelf="center"
        a11yTitle={intl.formatMessage(messages.acceptPortabilityRequest)}
        color="status-error"
        icon={<FormClose color="white" />}
        onClick={() => mutateRejectPortabilityRequest({})}
      />
    </Box>
  );
};

export const ItemTableRow = ({ item }: ItemTableRowProps) => {
  const intl = useIntl();

  return (
    <Box flex direction="row" align="center">
      <Box basis="40%">
        {intl.formatMessage(messages.rowPortabilityRequestText, {
          from_playlist: item.from_playlist.title,
          for_playlist: item.for_playlist.title,
        })}
      </Box>
      <Box basis="15%">{item.from_lti_consumer_site?.name || '-'}</Box>
      <Box basis="15%">
        {item.from_user?.email ||
          intl.formatMessage(messages.requestFromLtiUser)}
      </Box>
      <Box basis="10%">{item.updated_by_user?.email || '-'}</Box>
      <Box basis="10%">
        <PortabilityRequestStateTag state={item.state} />
      </Box>
      <Box basis="10%">
        {item.can_accept_or_reject ? (
          <AcceptRejectButtons item={item} />
        ) : (
          <React.Fragment />
        )}
      </Box>
    </Box>
  );
};
