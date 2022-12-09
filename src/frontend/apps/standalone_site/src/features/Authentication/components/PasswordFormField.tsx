import { Button, Box, FormField, TextInput } from 'grommet';
import { Hide, View } from 'grommet-icons';
import React from 'react';

export const PasswordFormField = () => {
  const [value, setValue] = React.useState('');
  const [reveal, setReveal] = React.useState(false);

  return (
    <FormField label="Password" name="password" required value={value}>
      <Box direction="row" fill>
        <TextInput
          aria-label="password"
          name="password"
          plain
          type={reveal ? 'text' : 'password'}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <Button
          icon={reveal ? <View size="medium" /> : <Hide size="medium" />}
          onClick={() => setReveal(!reveal)}
        />
      </Box>
    </FormField>
  );
};
