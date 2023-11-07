import { Tag } from 'grommet';
import { colorsTokens } from 'lib-common';
import { PortabilityRequestState } from 'lib-components';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

const NeutralStyledTag = styled(Tag)`
  color: ${colorsTokens['info-500']};
  border-color: ${colorsTokens['info-500']};
  width: fit-content;
  & > div {
    width: 100%;
  }
`;

const StatusOkStyledTag = styled(Tag)`
  color: ${colorsTokens['success-600']};
  border-color: ${colorsTokens['success-600']};
  width: fit-content;
  & > div {
    width: 100%;
  }
`;

const StatusErrorStyledTag = styled(Tag)`
  color: ${colorsTokens['danger-400']};
  border-color: ${colorsTokens['danger-400']};
  width: fit-content;
  & > div {
    width: 100%;
  }
`;

const messages = defineMessages({
  pendingState: {
    defaultMessage: 'Pending',
    description: 'Pending display state',
    id: 'features.PortabilityRequestStateTag.pendingState',
  },
  acceptedState: {
    defaultMessage: 'Accepted',
    description: 'Accepted display state',
    id: 'features.PortabilityRequestStateTag.acceptedState',
  },
  rejectedState: {
    defaultMessage: 'Rejected',
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
          size="xsmall"
          alignSelf="center"
          value={intl.formatMessage(messages.pendingState)}
        />
      );
    case PortabilityRequestState.ACCEPTED:
      return (
        <StatusOkStyledTag
          size="xsmall"
          alignSelf="center"
          value={intl.formatMessage(messages.acceptedState)}
        />
      );
    case PortabilityRequestState.REJECTED:
      return (
        <StatusErrorStyledTag
          size="xsmall"
          alignSelf="center"
          value={intl.formatMessage(messages.rejectedState)}
        />
      );
    default:
      return (
        <NeutralStyledTag size="xsmall" alignSelf="center" value={state} />
      );
  }
};
