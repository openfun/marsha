import { Box } from 'grommet';
import { ExitCrossSVG } from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { useSetDisplayName } from '@lib-video/hooks/useSetDisplayName';

import { InputDisplayName } from '../InputDisplayName';

const messages = defineMessages({
  closeButtonTitle: {
    defaultMessage: 'Click this button to close the overlay.',
    description: 'A title describing the close button action',
    id: 'components.InputDiplayNameOverlay.closeButtonTitle',
  },
  inputAnonymousKeywordForbiddenAlertMessage: {
    defaultMessage: 'Keyword "{forbiddenPrefix}" is not allowed.',
    description:
      'An alert message explaining why the entered display name is invalid.',
    id: 'components.InputDisplayNameOverlay.inputAnonymousKeywordForbiddenAlertMessage',
  },
  inputDisplayNameInformative: {
    defaultMessage:
      "The display name is the pseudonym you will be authenticated with on this live. You won't be able to change it during the live. Other participants will see you with this name. The instructor will however be able to see your genuine identity if you have previously identified yourself with the LTI.",
    description:
      'An informative text about the display name which is asked to enter.',
    id: 'components.InputDisplayNameOverlay.inputDisplayNameInformative',
  },
  inputDisplayNameLabel: {
    defaultMessage: 'Display name',
    description: 'An label describing the input below.',
    id: 'components.InputDisplayNameOverlay.inputDisplayNameLabel',
  },
  inputDisplayNamePlaceholder: {
    defaultMessage: 'Enter your desired display name...',
    description: 'The input bar to fill your display name.',
    id: 'components.InputBar.inputDisplayNamePlaceholder',
  },
  inputTooShortAlertMessage: {
    defaultMessage: 'Min length is {minLength} characters.',
    description:
      'An alert message explaining why the entered display name is invalid.',
    id: 'components.InputDisplayNameOverlay.inputTooShortAlertMessage',
  },
  inputTooLongAlertMessage: {
    defaultMessage: 'Max length is {maxLength} characters.',
    description:
      'An alert message explaining why the entered display name is invalid.',
    id: 'components.InputDisplayNameOverlay.inputTooLongAlertMessage',
  },
  inputXmppError: {
    defaultMessage: 'Impossible to connect you to the chat. Please retry.',
    description: 'An alert message saying that the user cannot be connected.',
    id: 'components.InputDisplayNameOverlay.inputXmppError',
  },
  inputXmppTimeout: {
    defaultMessage: 'The server took too long to respond. Please retry.',
    description:
      'An alert message saying that the servers answer to the nickname change request took too much time.',
    id: 'components.InputDisplayNameOverlay.inputXmppTimeout',
  },
  inputNicknameAlreadyExists: {
    defaultMessage:
      'Your nickname is already used in the chat. Please choose another one.',
    description:
      "An alert message saying that the user can't select the entered nickname because someone is already using it in the chat.",
    id: 'components.InputDisplayNameOverlay.inputNicknameAlreadyExists',
  },
});

export const InputDisplayNameOverlay = () => {
  const intl = useIntl();
  const [_, setDisplayName] = useSetDisplayName();

  const hideDisplayName = () => {
    setDisplayName(false);
  };

  return (
    <Box height="100%">
      <Box
        direction="row-reverse"
        margin={{
          right: '5px',
          top: '5px',
        }}
      >
        <Box
          onClick={hideDisplayName}
          title={intl.formatMessage(messages.closeButtonTitle)}
        >
          <ExitCrossSVG
            containerStyle={{
              height: '20px',
              width: '20px',
            }}
            iconColor="blue-focus"
          />
        </Box>
      </Box>
      <Box height="100%">
        <InputDisplayName onSuccess={hideDisplayName} />
      </Box>
    </Box>
  );
};
