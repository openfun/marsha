import { Anchor, Box, Button, Form, FormField, Text, TextInput } from 'grommet';
import { Hide, FormView, Alert } from 'grommet-icons';
import React, { useState } from 'react';
import { useIntl, defineMessages } from 'react-intl';
import { useHistory } from 'react-router-dom';

import { routes } from 'routes/routes';

import { useBasicLogin, UseBasicLoginError } from '../api/basicLogin';

const messages = defineMessages({
  labelSubmit: {
    defaultMessage: 'OK',
    description: 'Label submit button',
    id: 'features.Authentication.components.LoginForm.labelSubmit',
  },
  error: {
    defaultMessage: 'An error occurred',
    description: 'Error when trying to login',
    id: 'features.Authentication.components.LoginForm.error',
  },
  requiredField: {
    defaultMessage: 'This field is required to login.',
    description: 'Message when classroom field is missing.',
    id: 'features.Authentication.components.LoginForm.requiredField',
  },
  passwordLost: {
    defaultMessage: 'Forgot your password?',
    description: 'Message to redirect to password lost page.',
    id: 'features.Authentication.components.LoginForm.passwordLost',
  },
  usernameLabel: {
    defaultMessage: 'Username',
    description: 'Label for username field.',
    id: 'features.Authentication.components.LoginForm.usernameLabel',
  },
  passwordLabel: {
    defaultMessage: 'Password',
    description: 'Label for password field.',
    id: 'features.Authentication.components.LoginForm.passwordLabel',
  },
});

export const LoginForm = () => {
  const intl = useIntl();
  const [value, setValue] = useState({ username: '', password: '' });
  const [reveal, setReveal] = useState(false);
  const [message, setMessage] = useState('');
  const history = useHistory();
  const { mutate: basicLogin } = useBasicLogin({
    onError: (error: UseBasicLoginError) => {
      setMessage(error.detail || intl.formatMessage(messages.error));
    },
    onSuccess: () => {
      history.push('/');
    },
  });

  return (
    <Form
      value={value}
      onChange={(updateValue) => setValue(updateValue)}
      onSubmit={({ value: submitValue }) => basicLogin(submitValue)}
      messages={{
        required: intl.formatMessage(messages.requiredField),
      }}
    >
      <FormField
        label={intl.formatMessage(messages.usernameLabel)}
        name="username"
        required
      >
        <TextInput
          aria-label={intl.formatMessage(messages.usernameLabel)}
          name="username"
          type="username"
        />
      </FormField>
      <FormField
        label={intl.formatMessage(messages.passwordLabel)}
        name="password"
        margin={{ bottom: 'xsmall' }}
        required
      >
        <Box direction="row" fill>
          <TextInput
            aria-label={intl.formatMessage(messages.passwordLabel)}
            name="password"
            plain
            type={reveal ? 'text' : 'password'}
          />
          <Button
            plain
            style={{ margin: '0 1rem' }}
            icon={reveal ? <FormView size="medium" /> : <Hide size="medium" />}
            onClick={() => setReveal(!reveal)}
          />
        </Box>
      </FormField>
      <Anchor
        color="blue-active"
        weight="normal"
        style={{ textDecoration: 'underline' }}
        label={intl.formatMessage(messages.passwordLost)}
        href={routes.PASSWORD_RESET.path}
        size="xsmall"
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
