import { Box } from 'grommet';
import {
  Document,
  DocumentXapiStatement,
  useCurrentSession,
  useDocument,
  useJwt,
} from 'lib-components';
import React from 'react';
import styled from 'styled-components';

const IconBox = styled.span`
  font-size: 64px;
  margin-right: 12px;
`;

interface DocumentPlayerProps {
  document: Document;
}

const DocumentPlayer = (props: DocumentPlayerProps) => {
  const document = useDocument((state) => state.getDocument(props.document));
  const jwt = useJwt((state) => state.getJwt());

  if (!jwt) {
    throw new Error('Jwt is required.');
  }

  const onDownload = () => {
    const callback = () => {
      const documentXapiStatement = new DocumentXapiStatement(
        jwt,
        useCurrentSession.getState().sessionId,
        document.id,
      );
      documentXapiStatement.downloaded();
      window.removeEventListener('blur', callback);
    };

    window.addEventListener('blur', callback);
  };

  return (
    <Box align="center" justify="center" direction="row">
      <IconBox className="icon-file-text2" />
      <a onClick={onDownload} href={document.url} download>
        {document.title}
      </a>
    </Box>
  );
};

export default DocumentPlayer;
