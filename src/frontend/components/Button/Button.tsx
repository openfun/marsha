import styled from 'styled-components';

import { styledComponentWithProps } from '../../utils/styledComponentsTs';
import { colorName, colors } from '../../utils/theme/theme';

export const Button = styledComponentWithProps<{ variant: colorName }>(
  styled.button,
)`
  display: inline-block;
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  user-select: none;
  border: 1px solid transparent;
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
  line-height: 1.5;
  border-radius: 0.25rem;
  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out,
    border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;

  ${props => `
    color: white;
    background-color: ${colors[props.variant].main};
    border-color: ${colors[props.variant].main};
  `};

  &:hover,
  &:focus {
    text-decoration: none;
  }

  ${props => `
    &:hover {
      background-color: ${colors[props.variant].contrast};
      border-color: ${colors[props.variant].contrast};
    }
  `};

  &:focus, &.focus {
    outline: 0;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  }

  &.disabled, &:disabled {
    opacity: 0.65;
  }

  &:not(:disabled):not(.disabled) {
    cursor: pointer;
  }
`;
