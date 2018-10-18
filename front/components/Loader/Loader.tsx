import styled from 'styled-components';

import { colors } from '../../utils/theme/theme';

const LoaderStyled = styled.div`
  border: 0.125rem solid transparent;
  border-left-color: ${colors.primary.main};
  border-top-color: ${colors.primary.main};
  border-radius: 50%;
  width: 1rem;
  height: 1rem;
  animation: spin 0.8s linear infinite;
  display: inline-block;
  margin-left: 0.5rem;
  vertical-align: baseline;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

export const Loader = () => (
  <LoaderStyled aria-busy="true" aria-live="polite" />
);
