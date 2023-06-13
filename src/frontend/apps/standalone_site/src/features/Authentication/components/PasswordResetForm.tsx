import { Box, Button, Form, FormField, Text, TextInput } from 'grommet';
import { Alert } from 'grommet-icons';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';

import { routes } from 'routes';

import {
  usePasswordReset,
  UsePasswordResetError,
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
  requiredField: {
    defaultMessage: 'This field is required.',
    description: 'Message when required field is missing.',
    id: 'features.Authentication.components.PasswordResetForm.requiredField',
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
  const [value, setValue] = useState({ email: '' });
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
    <Form
      value={value}
      onChange={(updateValue) => setValue(updateValue)}
      onSubmit={({ value: submitValue }) =>
        passwordReset({ confirm_url, ...submitValue })
      }
      messages={{
        required: intl.formatMessage(messages.requiredField),
      }}
    >
      <Box
        direction="row"
        align="center"
        justify="center"
        margin={{ vertical: 'medium' }}
        gap="small"
      >
        <Text weight="bold" size="small">
          {intl.formatMessage(messages.explainingText)}
        </Text>
      </Box>
      <FormField
        label={intl.formatMessage(messages.labelFieldEmail)}
        name="email"
        required
      >
        <TextInput
          aria-label={intl.formatMessage(messages.labelFieldEmail)}
          name="email"
          type="email"
        />
      </FormField>
      {message && (
        <Box
          direction="row"
          align="center"
          justify="center"
          margin={{ vertical: 'medium' }}
          gap="small"
        >
          <Alert size="medium" color="#df8c00" />
          <Text weight="bold" size="small">
            {message}
          </Text>
        </Box>
      )}
      <Box flex={false} margin={{ top: 'medium' }}>
        <Button
          type="submit"
          label={intl.formatMessage(messages.labelSubmit)}
          primary
          fill
        />
      </Box>
    </Form>
  );
};
