import { Box, Button, Form, FormField, Text, TextInput } from 'grommet';
import { Alert, FormView, Hide } from 'grommet-icons';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';

import {
  UsePasswordResetConfirmError,
  usePasswordResetConfirm,
} from '../api/usePasswordResetConfirm';

const messages = defineMessages({
  passwordLabel: {
    defaultMessage: 'Password',
    description: 'Label for password field',
    id: 'features.Authentication.components.PasswordResetConfirmForm.passwordLabel',
  },
  passwordConfirmLabel: {
    defaultMessage: 'Password confirm',
    description: 'Aria label for password confirmation field',
    id: 'features.Authentication.components.PasswordResetConfirmForm.passwordConfirmLabel',
  },
  labelSubmit: {
    defaultMessage: 'Reset my password',
    description: 'Label submit button',
    id: 'features.Authentication.components.PasswordResetConfirmForm.labelSubmit',
  },
  error: {
    defaultMessage: 'An error occurred',
    description: 'Error when trying to send request',
    id: 'features.Authentication.components.PasswordResetConfirmForm.error',
  },
  requiredField: {
    defaultMessage: 'This field is required.',
    description: 'Message when required field is missing.',
    id: 'features.Authentication.components.PasswordResetConfirmForm.requiredField',
  },
  explainingText: {
    defaultMessage:
      'To set your new password, enter the new password twice below.',
    description: 'Help text for password reset.',
    id: 'features.Authentication.components.PasswordResetConfirmForm.explainingText',
  },
  successText: {
    defaultMessage: 'Password has been successfully reset.',
    description: 'Displayed text when password reset request succeeded.',
    id: 'features.Authentication.components.PasswordResetConfirmForm.successText',
  },
});

interface PasswordResetConfirmFormProps {
  uid: string;
  token: string;
}

export const PasswordResetConfirmForm = ({
  uid,
  token,
}: PasswordResetConfirmFormProps) => {
  const intl = useIntl();
  const [value, setValue] = useState({ new_password1: '', new_password2: '' });
  const [revealPassword1, setRevealPassword1] = useState(false);
  const [revealPassword2, setRevealPassword2] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { mutate: passwordReset } = usePasswordResetConfirm({
    onError: (error: UsePasswordResetConfirmError) => {
      setMessage(error.detail || intl.formatMessage(messages.error));
    },
    onSuccess: () => {
      toast.success(intl.formatMessage(messages.successText));
      navigate('/');
    },
  });

  return (
    <Form
      value={value}
      onChange={(updateValue) => setValue(updateValue)}
      onSubmit={({ value: submitValue }) =>
        passwordReset({ uid, token, ...submitValue })
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
        label={intl.formatMessage(messages.passwordLabel)}
        name="new_password1"
        margin={{ bottom: 'xsmall' }}
        required
      >
        <Box direction="row" fill>
          <TextInput
            aria-label={intl.formatMessage(messages.passwordLabel)}
            name="new_password1"
            plain
            type={revealPassword1 ? 'text' : 'password'}
          />
          <Button
            plain
            style={{ margin: '0 1rem' }}
            icon={
              revealPassword1 ? (
                <FormView size="medium" />
              ) : (
                <Hide size="medium" />
              )
            }
            onClick={() => setRevealPassword1(!revealPassword1)}
          />
        </Box>
      </FormField>
      <FormField
        label={intl.formatMessage(messages.passwordLabel)}
        name="new_password2"
        margin={{ bottom: 'xsmall' }}
        required
      >
        <Box direction="row" fill>
          <TextInput
            aria-label={intl.formatMessage(messages.passwordConfirmLabel)}
            name="new_password2"
            plain
            type={revealPassword2 ? 'text' : 'password'}
          />
          <Button
            plain
            style={{ margin: '0 1rem' }}
            icon={
              revealPassword2 ? (
                <FormView size="medium" />
              ) : (
                <Hide size="medium" />
              )
            }
            onClick={() => setRevealPassword2(!revealPassword2)}
          />
        </Box>
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
