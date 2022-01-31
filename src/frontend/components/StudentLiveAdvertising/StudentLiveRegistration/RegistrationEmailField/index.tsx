import { Box, Heading, TextInput } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { theme } from 'utils/theme/theme';

const messages = defineMessages({
  placeholder: {
    defaultMessage: 'example@openfun.fr',
    description: 'Placeholder for email textfield in live registration form',
    id: 'components.SubscribScheduledVideoEmail.form.field.email.placeholder',
  },
});

interface RegistrationEmailFieldProps {
  inputLabel: string;
  inputWidth?: string;
  id: string;
  name?: string;
  value?: any;
  onChange?: (event: any) => void;
}

export const RegistrationEmailField = ({
  inputLabel,
  children,
  inputWidth,
  id,
  ...props
}: React.PropsWithChildren<RegistrationEmailFieldProps>) => {
  const intl = useIntl();

  return (
    <Box direction="row" fill justify="between">
      <Box
        border={{
          color: normalizeColor('blue-focus', theme),
          size: '3px',
        }}
        pad={{ top: 'xsmall', left: 'xsmall' }}
        round="6px"
        width={inputWidth}
      >
        <Heading color="bg-grey" level={6} margin={{ bottom: 'xsmall' }}>
          {inputLabel}
        </Heading>
        <TextInput
          focusIndicator={false}
          id={id}
          placeholder={intl.formatMessage(messages.placeholder)}
          plain
          {...props}
        />
      </Box>

      {children}
    </Box>
  );
};
