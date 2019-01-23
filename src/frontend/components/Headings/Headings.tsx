import styled from 'styled-components';

const headingsStyle = `
  margin-bottom: 0.5rem;
  font-family: inherit;
  font-weight: 500;
  line-height: 1.2;
  color: inherit;
`;

export const H1 = styled.h1`
  font-size: 2.5rem;
  ${headingsStyle};
`;

export const H2 = styled.h2`
  font-size: 2rem;
  ${headingsStyle};
`;

export const H3 = styled.h3`
  font-size: 1.75rem;
  ${headingsStyle};
`;

export const H4 = styled.h4`
  font-size: 1.5rem;
  ${headingsStyle};
`;

export const H5 = styled.h5`
  font-size: 1.25rem;
  ${headingsStyle};
`;

export const H6 = styled.h6`
  font-size: 1rem;
  ${headingsStyle};
`;

export const IframeHeading = styled(H2)`
  padding: 0.5rem 0;
`;
