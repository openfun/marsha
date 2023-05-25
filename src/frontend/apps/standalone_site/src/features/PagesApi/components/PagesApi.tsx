import { Box, Heading } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { theme } from 'lib-common';
import ReactMarkdown from 'react-markdown';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';

import { ContentSpinner } from 'components/Spinner';

import { usePageApi } from '../api/usePageApi';

const BoxMarkdown = styled(Box)`
  & p {
    color: #000;
  }
  & a {
    color: ${normalizeColor('blue-active', theme)};
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
        <ContentSpinner boxProps={{ margin: { vertical: 'large' } }} />
      ) : (
        <BoxMarkdown
          width="large"
          background="#fff"
          margin="auto"
          pad={{ vertical: 'small', horizontal: 'medium' }}
          round="small"
        >
          <Heading>{data?.name || ''}</Heading>
          <ReactMarkdown>{data?.content || ''}</ReactMarkdown>
        </BoxMarkdown>
      )}
    </Box>
  );
};

export default PagesApi;
