import { Field, Input } from '@openfun/cunningham-react';
import { Box, Text } from 'grommet';
import { Alert } from 'grommet-icons';
import { ButtonLoader } from 'lib-components';
import { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { PrivateTextInputField } from 'components/Text/PrivateTextInputField';
import { routes } from 'routes/routes';
import { getLocalStorage } from 'utils/browser';

import { UseBasicLoginError, useBasicLogin } from '../api/basicLogin';

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
  const [error, setError] = useState<UseBasicLoginError['body']>();
  const { mutate: basicLogin, isLoading } = useBasicLogin({
    onError: (backError) => {
      setError(backError.body);
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
    <form
      onSubmit={(e) => {
        e.preventDefault();
        basicLogin(value);
      }}
      onChange={(e) => {
        const { name, value } = e.target as HTMLInputElement;
        setValue((_value) => ({ ..._value, [name]: value }));
        setError(undefined);
      }}
    >
      <Input
        aria-label={intl.formatMessage(messages.usernameLabel)}
        label={intl.formatMessage(messages.usernameLabel)}
        name="username"
        type="username"
        fullWidth
        required
        readOnly
        onFocus={(e) => e.currentTarget.removeAttribute('readonly')}
        state={error?.username ? 'error' : undefined}
        text={error?.username?.join(' ')}
      />
      <Field className="mt-s" fullWidth>
        <PrivateTextInputField
          autoComplete="current-password"
          name="password"
          label={intl.formatMessage(messages.passwordLabel)}
          state={error?.password ? 'error' : undefined}
          text={error?.password?.join(' ')}
        />
      </Field>
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
      {error?.detail && (
        <Box
          direction="row"
          align="center"
          justify="center"
          margin={{ vertical: 'medium' }}
          gap="small"
        >
          <Alert size="medium" color="#df8c00" />
          <Text weight="bold" size="small">
            {error?.detail}
          </Text>
        </Box>
      )}
      <Box flex={false} margin={{ top: 'medium' }}>
        <ButtonLoader
          label={intl.formatMessage(messages.labelSubmit)}
          isSubmitting={isLoading}
        />
      </Box>
    </form>
  );
};
