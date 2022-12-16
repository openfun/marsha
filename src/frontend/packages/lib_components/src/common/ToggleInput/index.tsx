import { Box, CheckBoxExtendedProps, Text } from 'grommet';
import React from 'react';
import styled from 'styled-components';

import { ToggleButton } from '../ToggleButton';

const StyledText = styled(Text)`
  font-family: 'Roboto-Medium';
`;

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
      <StyledText color="blue-active" size="1rem" truncate={truncateLabel}>
        {label}
      </StyledText>
    </Box>
  );
};
