import { TextInput as GrommetTextInput } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import React from 'react';
import styled from 'styled-components';

import { theme } from 'utils/theme/theme';

const StyledGrommetTextInput = styled(GrommetTextInput)`
  border: 1px solid ${normalizeColor('blue-active', theme)};
  border-radius: 4px;
  ::placeholder {
    color: ${normalizeColor('blue-chat', theme)};
    font-size: 1rem;
    font-style: italic;
  }
`;

interface TextInputProps {
  placeholder?: string;
  setValue: (inputText: string) => void;
  title?: string;
  value: string;
}

export const TextInput = ({
  placeholder,
  setValue,
  title,
  value,
}: TextInputProps) => {
  return (
    <StyledGrommetTextInput
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
