import { normalizeColor } from 'grommet/utils';
import * as React from 'react';
import styled from 'styled-components';

import { theme } from '../../utils/theme/theme';

// Use a large "download" icon to make the dropzone stand out visually
//
//                      ||
//                      ||
//                    \\||//
//                     \\//
//                 ____________
//
export const DropzoneIcon = () => (
  <DropzoneIconStyled
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="none"
    viewBox="0 0 8 8"
  >
    <path d="M3 0v3h-2l3 3 3-3h-2v-3h-2zm-3 7v1h8v-1h-8z" />
  </DropzoneIconStyled>
);
const DropzoneIconStyled = styled.svg`
  fill: ${normalizeColor('light-5', theme)};
  width: 4rem;
  height: 4rem;
`;
