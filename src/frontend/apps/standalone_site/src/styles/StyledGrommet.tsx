import {
  Box as BoxGrommet,
  BoxExtendedProps,
  Text as TextGrommet,
  TextExtendedProps,
} from 'grommet';
import styled from 'styled-components';

interface StyledProps {
  css?: string;
}

/**
 * @description: Text component with styled-components
 */
const TextStyled = styled(TextGrommet)<StyledProps>`
  ${(props) => props.css || ''};
`;
interface TextProps extends StyledProps, TextExtendedProps {}
export const Text = (props: TextProps) => {
  return <TextStyled {...props} />;
};

/**
 * @description: Box component with styled-components
 */
const BoxStyled = styled(BoxGrommet)<StyledProps>`
  ${(props) => props.css || ''};
`;
interface BoxProps extends StyledProps, BoxExtendedProps {}
export const Box = (props: BoxProps) => {
  return <BoxStyled {...props} />;
};
