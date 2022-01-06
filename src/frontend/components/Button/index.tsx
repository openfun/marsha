import React, { useLayoutEffect, useState, useRef, useContext } from 'react';
import { Box, Button as GrommetButton, ResponsiveContext, Text } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import styled from 'styled-components';

import { SvgProps } from 'components/SVGIcons';
import { theme } from 'utils/theme/theme';
import { Nullable } from 'utils/types';

const StyledGrommetButton = styled(GrommetButton)`
  height: 100%;
  padding: 0;
`;

interface ResponsiveProps {
  size: string;
}

const IconBox = styled(Box)`
  display: flex;
  height: ${({ size }: ResponsiveProps) => (size === 'small' ? '60%' : '80%')};
  margin: ${({ size }: ResponsiveProps) =>
    size === 'small' ? '0 6px' : '0 8px'};
  margin-bottom: 6px;
  min-height: 0;
  position: relative;
  width: 100%;
`;

const TextBox = styled(Box)`
  display: flex;
  height: ${({ size }: ResponsiveProps) => (size === 'small' ? '40%' : '20%')};
  text-align: center;
  width: 100%;
`;

const StyledText = styled(Text)`
  font-family: Roboto-Regular;
  font-weight: normal;
  font-size: ${({ size }: ResponsiveProps) =>
    size === 'small' ? '0.7rem' : '0.9rem'};
  letter-spacing: ${({ size }: ResponsiveProps) =>
    size === 'small' ? '-0.3px' : '-0.13px'};
  line-height: ${({ size }: ResponsiveProps) =>
    size === 'small' ? '0.8rem' : '0.9rem'};
  margin: auto;
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
  const size = useContext(ResponsiveContext);
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
              <IconBox ref={iconRef} size={size}>
                <Box margin="auto">
                  <Icon containerStyle={containerStyle} iconColor={iconColor} />
                  {badge}
                </Box>
              </IconBox>
            )}

            {label && (
              <TextBox size={size}>
                <StyledText
                  color={normalizeColor('blue-active', theme)}
                  size={size}
                >
                  {label}
                </StyledText>
              </TextBox>
            )}
          </Box>
        );
      }}
    </StyledGrommetButton>
  );
};
