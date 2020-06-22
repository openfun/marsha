import { normalizeColor } from 'grommet/utils';
import React from 'react';
import styled from 'styled-components';

import { theme } from '../../utils/theme/theme';

const Preloader = styled.div`
  width: 100%;
  height: 100%;
  top: 0px;
  position: fixed;
  z-index: 99999;
  background-color: rgba(255, 255, 255, 0.4);
`;

const Spinner = styled.div`
  position: absolute;
  top: calc(50% - 3.5px);
  left: calc(50% - 3.5px);

  border: 0.125rem solid transparent;
  border-left-color: ${normalizeColor('brand', theme)};
  border-top-color: ${normalizeColor('brand', theme)};
  border-radius: 50%;
  width: 31px;
  height: 31px;
  animation: spin 0.8s linear infinite;
  display: inline-block;
  margin: 0 auto;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

/** Component. Displays a rotating CSS loader. */
export const Loader = () => (
  <Preloader>
    <Spinner aria-busy="true" aria-live="polite" />
  </Preloader>
);
