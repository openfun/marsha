import { Grommet, Text, TextInput } from 'grommet';
import { deepMerge, normalizeColor } from 'grommet/utils';
import React from 'react';
import { theme } from 'utils/theme/theme';

const customToggleTheme = {
  textInput: {
    container: {
      extend: `
      border: 1px solid ${normalizeColor('blue-active', theme)};
      border-radius: 4px;
      `,
    },
  },
};

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
    <Grommet theme={deepMerge(theme, customToggleTheme)}>
      <TextInput
        a11yTitle={title}
        focusIndicator={false}
        onChange={(event) => setValue(event.target.value)}
        placeholder={
          placeholder && (
            <Text
              color={'blue-chat'}
              size="1rem"
              truncate
              style={{
                fontFamily: 'Roboto-Regular',
                fontStyle: 'italic',
              }}
            >
              {placeholder}
            </Text>
          )
        }
        plain
        size="1rem"
        style={{
          fontFamily: 'Roboto-Regular',
        }}
        spellCheck={false}
        title={title}
        value={value}
      />
    </Grommet>
  );
};
