import styled from 'styled-components';

/**
 * Visually move an element offscreen, so it is not visible while still present in the
 * accessibility tree and for screen reader users.
 */
export const Offscreen = styled.div`
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
