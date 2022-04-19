import { TextInput } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import React from 'react';
import styled from 'styled-components';

import { theme } from 'utils/theme/theme';

const StyledTextInput = styled(TextInput)`
  border: 1px solid ${normalizeColor('blue-active', theme)};
  border-radius: 4px;
  font-family: 'Roboto-Regular';
  ::placeholder {
    color: ${normalizeColor('blue-chat', theme)};
    font-family: 'Roboto-Regular';
    font-size: 1rem;
    font-style: italic;
  }
`;

interface DashboardVideoLiveWidgetTextInputProps {
  placeholder?: string;
  setValue: (inputText: string) => void;
  title?: string;
  value: string;
}

export const DashboardVideoLiveWidgetTextInput = ({
  placeholder,
  setValue,
  title,
  value,
}: DashboardVideoLiveWidgetTextInputProps) => {
  return (
    <StyledTextInput
      a11yTitle={title}
      focusIndicator={false}
      onChange={(event) => setValue(event.target.value)}
      placeholder={placeholder}
      plain
      size="1rem"
      spellCheck={false}
      title={title}
      value={value}
    />
  );
};
