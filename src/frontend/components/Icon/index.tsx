import React from 'react';
import styled from 'styled-components';

import { appData } from '../../data/appData';

type SvgProps = { size: string };

const Svg = styled.svg`
  width: ${({ size }: SvgProps) => size};
  height: ${({ size }: SvgProps) => size};
  fill: currentColor;
`;

interface IconProps {
  name: string;
  size?: string;
  title?: string;
}

export const Icon = ({ name, size = '1rem', title }: IconProps) => {
  return (
    <Svg role="img" size={size} aria-hidden={!title}>
      <use xlinkHref={`${appData.static.svg.icons}#${name}`} />
      {title ? <title>{title}</title> : null}
    </Svg>
  );
};
