import { Box, CheckBoxExtendedProps, Text } from 'grommet';
import React from 'react';
import styled from 'styled-components';

import { ToggleButton } from 'components/ToggleButton';

const StyledText = styled(Text)`
  font-family: 'Roboto-Medium';
`;

interface DashboardVideoLiveWidgetToggleInputProps
  extends CheckBoxExtendedProps {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const DashboardVideoLiveWidgetToggleInput = ({
  checked,
  disabled,
  label,
  onChange,
  ...props
}: DashboardVideoLiveWidgetToggleInputProps) => {
  return (
    <Box
      align="center"
      background="bg-select"
      direction="row"
      gap="25px"
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
      <StyledText color="blue-active" size="1rem" truncate>
        {label}
      </StyledText>
    </Box>
  );
};
