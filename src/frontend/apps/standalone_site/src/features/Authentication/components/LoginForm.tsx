import { Box, Button, Form, FormField, Text, TextInput } from 'grommet';
import { Hide, View } from 'grommet-icons';
import React, { useState } from 'react';
import { useIntl, defineMessages } from 'react-intl';
import { useHistory } from 'react-router-dom';

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
      <FormField label="Username" name="username" required>
        <TextInput aria-label="username" name="username" type="username" />
      </FormField>
      <FormField label="Password" name="password" required>
        <Box direction="row" fill>
          <TextInput
            aria-label="password"
            name="password"
            plain
            type={reveal ? 'text' : 'password'}
          />
          <Button
            icon={reveal ? <View size="medium" /> : <Hide size="medium" />}
            onClick={() => setReveal(!reveal)}
          />
        </Box>
      </FormField>
      {message && (
        <Box pad={{ horizontal: 'small' }}>
          <Text>{message}</Text>
        </Box>
      )}
      <Box flex={false}>
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
