import styled from 'styled-components';

import { styledComponentWithProps } from '../../utils/styledComponentsTs';
import { colorName, colors } from '../../utils/theme/theme';

export const ActionLink = styledComponentWithProps<{ variant: colorName }>(
  styled.span,
)`
  cursor: pointer;

  ${props => `
    color: ${colors[props.variant].main};

    :hover {
      color: ${colors[props.variant].contrast};
      text-decoration: underline;
    }
  `}
`;
