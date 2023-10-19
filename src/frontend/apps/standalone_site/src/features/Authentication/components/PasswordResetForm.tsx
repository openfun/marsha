import { Button, Input } from '@openfun/cunningham-react';
import { Box } from 'grommet';
import { Alert } from 'grommet-icons';
import { Text } from 'lib-components';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';

import { routes } from 'routes';

import {
  UsePasswordResetError,
  usePasswordReset,
} from '../api/usePasswordReset';

const messages = defineMessages({
  labelFieldEmail: {
    defaultMessage: 'Email',
    description: 'Email field name',
    id: 'features.Authentication.components.PasswordResetForm.labelFieldEmail',
  },
  labelSubmit: {
    defaultMessage: 'Reset my password',
    description: 'Label submit button',
    id: 'features.Authentication.components.PasswordResetForm.labelSubmit',
  },
  error: {
    defaultMessage: 'An error occurred',
    description: 'Error when trying to send request',
    id: 'features.Authentication.components.PasswordResetForm.error',
  },
  explainingText: {
    defaultMessage:
      'Forgotten your password? Enter your email address below, and we’ll email instructions for setting a new one.',
    description: 'Help text for password reset.',
    id: 'features.Authentication.components.PasswordResetForm.explainingText',
  },
  successText: {
    defaultMessage: 'Password reset e-mail has been sent.',
    description: 'Displayed text when password reset request succeeded.',
    id: 'features.Authentication.components.PasswordResetForm.successText',
  },
});

export const PasswordResetForm = () => {
  const intl = useIntl();
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { mutate: passwordReset } = usePasswordReset({
    onError: (error: UsePasswordResetError) => {
      setMessage(error.detail || intl.formatMessage(messages.error));
    },
    onSuccess: () => {
      toast.success(intl.formatMessage(messages.successText));
      navigate('/');
    },
  });

  // Build the reset URL, which will be sent to user by email
  const confirm_url = `${
    window.location.origin
  }${routes.PASSWORD_RESET.subRoutes.CONFIRM.path.replace(':uid/:token', '')}`;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();

        const { value: email } = e.currentTarget.elements.namedItem(
          'email',
        ) as RadioNodeList;

        if (email) {
          passwordReset({ confirm_url, email });
        }
      }}
    >
      <Box
        direction="row"
        align="center"
        justify="center"
        margin={{ vertical: 'medium' }}
        gap="small"
      >
        <Text weight="bold">{intl.formatMessage(messages.explainingText)}</Text>
      </Box>
      <Input
        aria-label={intl.formatMessage(messages.labelFieldEmail)}
        label={intl.formatMessage(messages.labelFieldEmail)}
        name="email"
        type="email"
        fullWidth
        required
      />
      {message && (
        <Box
          direction="row"
          align="center"
          justify="center"
          margin={{ vertical: 'medium' }}
          gap="small"
        >
          <Alert size="medium" color="#df8c00" />
          <Text weight="bold">{message}</Text>
        </Box>
      )}
      <Box flex={false} margin={{ top: 'medium' }}>
        <Button type="submit" fullWidth>
          {intl.formatMessage(messages.labelSubmit)}
        </Button>
      </Box>
    </form>
  );
};
