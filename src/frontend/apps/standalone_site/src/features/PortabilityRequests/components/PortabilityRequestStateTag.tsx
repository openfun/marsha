import { Tag } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { theme } from 'lib-common';
import { PortabilityRequestState } from 'lib-components';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

const NeutralStyledTag = styled(Tag)`
  color: ${normalizeColor('blue-active', theme)};
  border-color: ${normalizeColor('blue-active', theme)};
`;

const StatusOkStyledTag = styled(Tag)`
  color: ${normalizeColor('status-ok', theme)};
  border-color: ${normalizeColor('status-ok', theme)};
`;

const StatusErrorStyledTag = styled(Tag)`
  color: ${normalizeColor('status-error', theme)};
  border-color: ${normalizeColor('status-error', theme)};
`;

const messages = defineMessages({
  pendingState: {
    defaultMessage: 'pending',
    description: 'Pending display state',
    id: 'features.PortabilityRequestStateTag.pendingState',
  },
  acceptedState: {
    defaultMessage: 'accepted',
    description: 'Accepted display state',
    id: 'features.PortabilityRequestStateTag.acceptedState',
  },
  rejectedState: {
    defaultMessage: 'rejected',
    description: 'Rejected display state',
    id: 'features.PortabilityRequestStateTag.rejectedState',
  },
});

export const PortabilityRequestStateTag = ({
  state,
}: {
  state: PortabilityRequestState;
}) => {
  const intl = useIntl();

  switch (state) {
    case PortabilityRequestState.PENDING:
      return (
        <NeutralStyledTag
          alignSelf="center"
          value={intl.formatMessage(messages.pendingState)}
        />
      );
    case PortabilityRequestState.ACCEPTED:
      return (
        <StatusOkStyledTag
          alignSelf="center"
          value={intl.formatMessage(messages.acceptedState)}
        />
      );
    case PortabilityRequestState.REJECTED:
      return (
        <StatusErrorStyledTag
          alignSelf="center"
          value={intl.formatMessage(messages.rejectedState)}
        />
      );
    default:
      return <NeutralStyledTag alignSelf="center" value={state} />;
  }
};
