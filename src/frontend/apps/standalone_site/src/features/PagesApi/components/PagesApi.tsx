import { colorsTokens, sizesTokens } from 'lib-common';
import { Box, BoxLoader, Heading } from 'lib-components';
import ReactMarkdown from 'react-markdown';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';

import { usePageApi } from '../api/usePageApi';

const BoxMarkdown = styled(Box)`
  & p {
    color: #000;
  }
  & a {
    color: ${colorsTokens['info-500']};
  }
  box-shadow: inset rgba(2, 117, 180, 0.3) 1px 1px 6px 0px;
  & h1 {
    font-size: 40px;
  }
`;

const PagesApi = () => {
  const location = useLocation();
  const { data, isLoading } = usePageApi(location.pathname.slice(1));

  return (
    <Box margin={{ top: 'auto' }}>
      {isLoading ? (
        <BoxLoader boxProps={{ margin: { vertical: 'large' } }} />
      ) : (
        <BoxMarkdown
          width={{
            max: sizesTokens.large,
          }}
          background="#fff"
          round="small"
          margin="auto"
          pad={{
            horizontal: 'medium',
            vertical: 'small',
          }}
        >
          <Heading className="mt-sl">{data?.name || ''}</Heading>
          <ReactMarkdown>{data?.content || ''}</ReactMarkdown>
        </BoxMarkdown>
      )}
    </Box>
  );
};

export default PagesApi;
