import { Box, Button, Form, FormField, Text, TextInput } from 'grommet';
import React from 'react';
import { useHistory } from 'react-router-dom';

import { useBasicLogin, UseBasicLoginError } from '../api/basicLogin';

import { PasswordFormField } from './PasswordFormField';

export const LoginForm = () => {
  const [value, setValue] = React.useState({ username: '', password: '' });
  const [message, setMessage] = React.useState('');
  const history = useHistory();
  const { mutate: basicLogin } = useBasicLogin({
    onError: (error: UseBasicLoginError) => {
      setMessage(error.detail || 'An error occurred');
    },
    onSuccess: () => {
      history.push('/');
    },
  });

  return (
    <Form
      value={value}
      onChange={(nextValue) => setValue(nextValue)}
      onSubmit={({ value: nextValue }) => basicLogin(nextValue)}
    >
      <FormField label="Username" name="username" required>
        <TextInput aria-label="username" name="username" type="username" />
      </FormField>

      <PasswordFormField />

      {message && (
        <Box pad={{ horizontal: 'small' }}>
          <Text>{message}</Text>
        </Box>
      )}

      <Box direction="row" justify="between" margin={{ top: 'medium' }}>
        <Button type="submit" label="Login" primary />
      </Box>
    </Form>
  );
};
