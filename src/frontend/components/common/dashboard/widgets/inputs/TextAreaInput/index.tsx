import { Grommet, TextArea } from 'grommet';
import { deepMerge, normalizeColor } from 'grommet/utils';
import React from 'react';

import { theme } from 'utils/theme/theme';

const customToggleTheme = {
  global: {
    colors: {
      placeholder: normalizeColor('blue-active', theme),
    },
  },
  textArea: {
    extend: `
      border: 1px solid ${normalizeColor('blue-active', theme)};
      border-radius: 4px;
      `,
  },
};

interface TextAreaInputProps {
  placeholder?: string;
  setValue: (inputText: string) => void;
  title?: string;
  value: string;
}

export const TextAreaInput = ({
  placeholder,
  setValue,
  title,
  value,
}: TextAreaInputProps) => {
  return (
    <Grommet theme={deepMerge(theme, customToggleTheme)}>
      <TextArea
        a11yTitle={title}
        focusIndicator={false}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        plain
        resize={false}
        size="0.938rem"
        spellCheck={false}
        style={{
          height: '140px',
        }}
        title={title}
        value={value}
      />
    </Grommet>
  );
};
