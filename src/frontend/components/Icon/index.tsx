import React from 'react';
import styled from 'styled-components';

import { appData } from '../../data/appData';

const Svg = styled.svg`
  width: 1rem;
  height: 1rem;
  fill: currentColor;
`;

interface IconProps {
  name: string;
  title?: string;
}

export const Icon = ({ name, title }: IconProps) => {
  return (
    <Svg role="img" aria-hidden={!title}>
      <use xlinkHref={`${appData.static.svg.icons}#${name}`} />
      {title ? <title>{title}</title> : null}
    </Svg>
  );
};
