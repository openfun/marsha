import { Text } from 'grommet';
import styled from 'styled-components';

export const TextTruncated = styled(Text)`
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;
