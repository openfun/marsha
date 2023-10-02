import { Switch } from '@openfun/cunningham-react';
import { Box } from 'grommet';
import React from 'react';

interface ToggleInputProps {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ToggleInput = ({
  checked,
  disabled,
  label,
  onChange,
}: ToggleInputProps) => {
  return (
    <Box
      align="center"
      background="bg-select"
      direction="row"
      gap="medium"
      height="60px"
      pad={{ horizontal: '36px' }}
      round="6px"
    >
      <Switch
        disabled={disabled}
        checked={checked}
        onChange={onChange}
        label={label}
        labelSide="right"
      />
    </Box>
  );
};
