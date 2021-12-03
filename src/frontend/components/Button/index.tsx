import React, { useLayoutEffect, useState, useRef } from 'react';
import { Box, Button as GrommetButton, Text } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import styled from 'styled-components';

import { SvgProps } from 'components/SVGIcons';
import { theme } from 'utils/theme/theme';
import { Nullable } from 'utils/types';

const StyledGrommetButton = styled(GrommetButton)`
  height: 100%;
  padding: 0;
`;

const StyledBox = styled(Box)`
  display: flex;
  flex: 1;
  margin: 0 8px;
  margin-bottom: 6px;
  min-height: 0;
  position: relative;
  width: 100%;
`;

const StyledText = styled(Text)`
  font-family: Roboto-Regular;
  font-weight: normal;
  letter-spacing: -0.13px;
  white-space: nowrap;
`;

interface ButtonProps {
  badge?: JSX.Element;
  disabled?: boolean;
  Icon?: React.FC<SvgProps>;
  label?: string;
  onClick?: () => void;
  reversed?: boolean;
  title?: string;
}

export const Button = ({
  badge,
  disabled,
  Icon,
  label,
  onClick,
  reversed,
  title,
}: ButtonProps) => {
  const iconRef = useRef<Nullable<HTMLDivElement>>(null);
  const [iconWidth, setIconWidth] = useState(0);

  useLayoutEffect(() => {
    if (iconRef.current === null) {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length !== 1) {
        return;
      }
      setIconWidth(
        Math.min(entries[0].contentRect.height, entries[0].contentRect.width),
      );
    });
    resizeObserver.observe(iconRef.current);
    return () => {
      if (iconRef.current === null) {
        return;
      }

      resizeObserver.unobserve(iconRef.current);
    };
  }, []);

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
        if (disabled) {
          tintColor = normalizeColor('blue-off', theme);
        } else if (reversed) {
          tintColor = normalizeColor(
            hover ? 'blue-active' : 'blue-focus',
            theme,
          );
        } else {
          tintColor = normalizeColor(
            hover ? 'blue-focus' : 'blue-active',
            theme,
          );
        }

        const shouldHover = hover && !disabled;
        let iconColor;
        let containerStyle: React.CSSProperties;

        if ((reversed && !shouldHover) || (!reversed && shouldHover)) {
          iconColor = normalizeColor('white', theme);
          containerStyle = {
            background: tintColor,
            borderRadius: '6px',
            width: `${iconWidth}px`,
          };
        } else {
          iconColor = tintColor;
          containerStyle = {
            background: 'none',
            width: `${iconWidth}px`,
          };
        }

        return (
          <Box align="center" fill>
            {Icon && (
              <StyledBox role="icon_container" ref={iconRef}>
                <Box role="icon_resizer" margin="auto">
                  <Icon containerStyle={containerStyle} iconColor={iconColor} />
                  {badge}
                </Box>
              </StyledBox>
            )}

            {label && (
              <StyledText
                size=".8rem"
                color={normalizeColor('blue-active', theme)}
                role="button_title"
              >
                {label}
              </StyledText>
            )}
          </Box>
        );
      }}
    </StyledGrommetButton>
  );
};
