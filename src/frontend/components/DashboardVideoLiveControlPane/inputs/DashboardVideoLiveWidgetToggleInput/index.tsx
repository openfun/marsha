import { Box, Text } from 'grommet';
import React from 'react';
import styled from 'styled-components';

import { ToggleButton } from 'components/ToggleButton';

const StyledText = styled(Text)`
  font-family: 'Roboto-Medium';
`;

interface DashboardVideoLiveWidgetToggleInputProps {
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
      />
      <StyledText color="blue-active" size="1rem" truncate>
        {label}
      </StyledText>
    </Box>
  );
};
