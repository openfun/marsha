import { Field } from '@openfun/cunningham-react';
import { Box, Button } from 'grommet';
import { Alert } from 'grommet-icons';
import { Text } from 'lib-components';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';

import { PrivateTextInputField } from 'components/Text/PrivateTextInputField';

import {
  UsePasswordResetConfirmError,
  usePasswordResetConfirm,
} from '../api/usePasswordResetConfirm';

const messages = defineMessages({
  passwordLabel: {
    defaultMessage: 'New password',
    description: 'Label for password field',
    id: 'features.Authentication.components.PasswordResetConfirmForm.passwordLabel',
  },
  passwordConfirmLabel: {
    defaultMessage: 'Confirm new password',
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
    <form
      onSubmit={(e) => {
        e.preventDefault();
        passwordReset({ uid, token, ...value });
      }}
      onChange={(e) => {
        const { name, value } = e.target as HTMLInputElement;
        setValue((_value) => ({ ..._value, [name]: value }));
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
      <PrivateTextInputField
        autoComplete="new-password"
        name="new_password1"
        label={intl.formatMessage(messages.passwordLabel)}
      />
      <Field className="mt-s" fullWidth>
        <PrivateTextInputField
          name="new_password2"
          label={intl.formatMessage(messages.passwordConfirmLabel)}
        />
      </Field>
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
        <Button
          type="submit"
          label={intl.formatMessage(messages.labelSubmit)}
          primary
          fill
        />
      </Box>
    </form>
  );
};
