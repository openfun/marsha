import { CheckBox, ThemeContext } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { theme } from 'lib-common';
import React from 'react';

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

interface ToggleButtonProps {
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
}: ToggleButtonProps) => {
  return (
    <ThemeContext.Extend value={customToggleTheme}>
      <CheckBox
        a11yTitle={title}
        checked={checked}
        aria-checked={checked}
        disabled={disabled}
        onChange={onChange}
        title={title}
        toggle
      />
    </ThemeContext.Extend>
  );
};
