import { Box } from 'grommet';
import React from 'react';
import styled from 'styled-components';

import { useDocument } from '../../data/stores/useDocument';
import { Document } from '../../types/file';

const IconBox = styled.span`
  font-size: 64px;
  margin-right: 12px;
`;

interface DocumentPlayerProps {
  document: Document;
}

const DocumentPlayer = (props: DocumentPlayerProps) => {
  const document = useDocument(state => state.getDocument(props.document));

  return (
    <Box align="center" justify="center" direction="row">
      <IconBox className="icon-file-text2" />
      <a href={document.url}>{document.title}</a>
    </Box>
  );
};

export default DocumentPlayer;
