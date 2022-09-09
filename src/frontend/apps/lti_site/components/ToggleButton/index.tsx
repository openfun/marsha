import { CheckBox, Grommet } from 'grommet';
import { deepMerge, normalizeColor } from 'grommet/utils';
import React from 'react';

import { theme } from 'lib-common';

const customToggleTheme = {
  checkBox: {
    border: {
      color: normalizeColor('blue-active', theme),
      width: '1px',
    },
    color: normalizeColor('bg-select', theme),
    hover: {
      border: {
        color: 'none',
      },
    },
    toggle: {
      background: ({ checked }: { checked: boolean }) =>
        checked ? normalizeColor('blue-active', theme) : 'transparent',
      color: ({ checked }: { checked: boolean }) =>
        checked
          ? normalizeColor('bg-select', theme)
          : normalizeColor('blue-active', theme),
      knob: {
        extend: `
          top: 1px;
          left: 2px;
          height: 12px;
          width: 12px;
          `,
      },
      size: '40px',
      extend: `
          width: 32px;
          height: 16px;
          box-shadow: none;
        `,
    },
  },
};

interface ToggleButton {
  checked: boolean;
  disabled?: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  title?: string;
}

export const ToggleButton = ({
  disabled,
  checked,
  onChange,
  title,
}: ToggleButton) => {
  return (
    <Grommet theme={deepMerge(theme, customToggleTheme)}>
      <CheckBox
        a11yTitle={title}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        title={title}
        toggle
      />
    </Grommet>
  );
};
