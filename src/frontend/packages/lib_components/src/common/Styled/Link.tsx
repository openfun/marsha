import { Link } from 'react-router-dom';
import styled from 'styled-components';

interface StyledLinkProps {
  css?: string;
}

export const StyledLink = styled(Link)<StyledLinkProps>`
  height: inherit;
  display: flex;
  text-decoration: none;
  color: inherit;
  ${({ css }) => css}
`;
