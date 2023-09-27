import { Box, CheckBoxExtendedProps } from 'grommet';
import React from 'react';

import { Text } from '../Text';
import { ToggleButton } from '../ToggleButton';

interface ToggleInputProps extends CheckBoxExtendedProps {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  truncateLabel?: boolean;
}

export const ToggleInput = ({
  checked,
  disabled,
  label,
  onChange,
  truncateLabel = true,
  ...props
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
      <ToggleButton
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        title={label}
        {...props}
      />
      <Text size="large" weight="medium" truncate={truncateLabel}>
        {label}
      </Text>
    </Box>
  );
};
