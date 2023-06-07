import { Box } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { theme } from 'lib-common';
import React, { useState } from 'react';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';

/**
 * Visually move an element offscreen, so it is not visible while still present in the
 * accessibility tree and for screen reader users.
 */
const Offscreen = styled.div`
  border: 0;
  clip: rect(0, 0, 0, 0);
  clip-path: inset(50%);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  white-space: nowrap;
  width: 1px;
`;

const Preloader = styled(Box)`
  width: 100%;
  height: 100%;
  top: 0px;
  position: fixed;
  z-index: 99999;
  background-color: rgba(255, 255, 255, 0.4);
`;

export interface SpinnerLookProps {
  color?: string;
  size?: 'small' | 'medium' | 'large';
}

const SpinnerLook = styled.div<SpinnerLookProps>`
  border: 0.125rem solid transparent;
  border-left-color: ${(props) =>
    normalizeColor(props.color || 'brand', theme)};
  border-top-color: ${(props) => normalizeColor(props.color || 'brand', theme)};
  border-radius: 50%;
  width: ${(props) =>
    props.size === 'small'
      ? '1rem'
      : props.size === 'medium'
      ? '2rem'
      : '3rem'};
  height: ${(props) =>
    props.size === 'small'
      ? '1rem'
      : props.size === 'medium'
      ? '2rem'
      : '3rem'};
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

interface SpinnerProps extends SpinnerLookProps {
  'aria-hidden'?: boolean;
  role?: 'alert' | 'status';
}

/**
 * Displays a rotating CSS loader
 * @param aria-hidden Passthrough to remove the whole spinner from accessible tree.
 * @param role The role of the aria region. Informs aria-live. Defaults to "status".
 * @param size Set of available sizes for the spinner. Defaults to "medium".
 * @param color Color of the rotating spinner. Defaults to "brand".
 */
export const Spinner: React.FC<SpinnerProps> = (props) => {
  const { children } = props;
  const ariaHidden = props['aria-hidden'] || false;
  const role = props.role || 'status';
  const size = props.size || 'medium';

  const [uniqueID] = useState(uuidv4());

  return (
    <Box
      role={role}
      aria-live={role === 'alert' ? 'assertive' : 'polite'}
      aria-labelledby={uniqueID}
      aria-hidden={ariaHidden}
      margin="none"
      pad="none"
    >
      <SpinnerLook size={size} color={props.color} />
      <Offscreen id={uniqueID}>{children}</Offscreen>
    </Box>
  );
};

/**
 * Displays a full-page, fixed transparent gray overlay with a rotating CSS loader.
 * @param aria-hidden Passthrough to remove the whole spinner from accessible tree.
 * @param role The role of the aria region. Informs aria-live. Defaults to "status".
 * @param size Set of available sizes for the spinner. Defaults to "medium".
 */
export const Loader: React.FC<SpinnerProps> = (props) => {
  const ariaHidden = props['aria-hidden'] || false;

  return (
    <Preloader justify="center" aria-hidden={ariaHidden}>
      <Spinner {...props} />
    </Preloader>
  );
};
