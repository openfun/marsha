import { Button as GrommetButton, ThemeContext } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import React, { useContext } from 'react';
import styled from 'styled-components';

import { ButtonLayout, ButtonLayoutSubComponentProps } from './ButtonLayout';

const StyledGrommetButton = styled(GrommetButton)`
  height: 100%;
  padding: 0;
`;

interface ButtonProps extends ButtonLayoutSubComponentProps {
  disabled?: boolean;
  disabledHover?: boolean;
  onClick?: () => void;
  reversed?: boolean;
  title?: string;
}

export const Button = ({
  badge,
  disabled,
  disabledHover,
  Icon,
  label,
  onClick,
  reversed,
  title,
}: ButtonProps) => {
  const theme = useContext(ThemeContext);

  return (
    <StyledGrommetButton
      a11yTitle={title}
      disabled={disabled}
      onClick={onClick}
      plain
      title={title}
      fill
    >
      {({ hover }) => {
        let tintColor;
        let reverseLayout;
        if (disabled) {
          tintColor = normalizeColor('blue-off', theme);
          reverseLayout = reversed;
        } else if (hover && !disabledHover) {
          tintColor = normalizeColor('blue-active', theme);
          reverseLayout = true;
        } else {
          tintColor = normalizeColor('blue-focus', theme);
          reverseLayout = reversed;
        }

        return (
          <ButtonLayout
            badge={badge}
            Icon={Icon}
            label={label}
            reversed={reverseLayout}
            reversedColor={normalizeColor('white', theme)}
            tintColor={tintColor}
            textColor="clr-primary-500"
          />
        );
      }}
    </StyledGrommetButton>
  );
};
