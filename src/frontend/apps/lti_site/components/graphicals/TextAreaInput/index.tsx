import { TextArea, ThemeContext } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import React from 'react';

import { theme } from 'lib-common';

const customToggleTheme = {
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
    <ThemeContext.Extend value={customToggleTheme}>
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
    </ThemeContext.Extend>
  );
};
