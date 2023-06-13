import { Box, Button, Form, FormField, Text, TextInput } from 'grommet';
import { Alert, FormView, Hide } from 'grommet-icons';
import { ButtonLoader } from 'lib-components';
import { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { routes } from 'routes/routes';
import { getLocalStorage } from 'utils/browser';

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

const TARGET_URL_STORAGE_KEY = 'redirect_uri';

export const LoginForm = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [value, setValue] = useState({ username: '', password: '' });
  const [reveal, setReveal] = useState(false);
  const [message, setMessage] = useState('');
  const { mutate: basicLogin, isLoading } = useBasicLogin({
    onError: (error: UseBasicLoginError) => {
      setMessage(error.detail || intl.formatMessage(messages.error));
    },
    onSuccess: () => {
      const targetUri = getLocalStorage()?.getItem(TARGET_URL_STORAGE_KEY);
      getLocalStorage()?.removeItem(TARGET_URL_STORAGE_KEY);
      // redirect to the originally targeted URL (ie before the authentication loop)
      // or the root page if no target was set
      navigate(targetUri || pathname);
    },
  });

  /**
   * It is the default route when not logged in,
   * so if the pathname is not the login route, we redirect to it.
   */
  useEffect(() => {
    if (pathname !== routes.LOGIN.path) {
      getLocalStorage()?.setItem(TARGET_URL_STORAGE_KEY, pathname + search);
      navigate(routes.LOGIN.path);
    }
  }, [navigate, pathname, search]);

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
      <Link to={routes.PASSWORD_RESET.path}>
        <Text
          color="blue-active"
          weight="normal"
          style={{ textDecoration: 'underline' }}
          size="xsmall"
        >
          {intl.formatMessage(messages.passwordLost)}
        </Text>
      </Link>
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
        <ButtonLoader
          label={intl.formatMessage(messages.labelSubmit)}
          isSubmitting={isLoading}
        />
      </Box>
    </Form>
  );
};
