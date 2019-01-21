import styled from 'styled-components';

import { colorName, colors } from '../../utils/theme/theme';

interface Props {
  variant: colorName;
}

export const ActionLink = styled.span`
  cursor: pointer;

  ${(props: Props) => `
    color: ${colors[props.variant].main};

    :hover {
      color: ${colors[props.variant].contrast};
      text-decoration: underline;
    }
  `}
`;
