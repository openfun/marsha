import { colorsTokens } from '@lib-common/cunningham';
import { Switch } from '@openfun/cunningham-react';
import React from 'react';

import { Box } from '../Box';

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
      background={colorsTokens['info-150']}
      direction="row"
      gap="medium"
      pad={{ horizontal: 'xmedium', vertical: 'small' }}
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
