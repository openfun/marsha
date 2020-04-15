import { Box } from 'grommet';
import React, { useEffect } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { pollForTrack } from '../../data/sideEffects/pollForTrack';
import { useDocument } from '../../data/stores/useDocument';
import { Document } from '../../types/file';
import { modelName } from '../../types/models';
import { uploadState } from '../../types/tracks';
import { DashboardInternalHeading } from '../Dashboard/DashboardInternalHeading';
import { DashboardDocumentTitleForm } from '../DashboardDocumentTitleForm';
import { DashboardObjectProgress } from '../DashboardObjectProgress';
import { DashboardPaneButtons } from '../DashboardPaneButtons';
import { DashboardPaneHelptext } from '../DashboardPaneHelptext';
import DocumentPlayer from '../DocumentPlayer';
import { UploadStatusPicker } from '../UploadStatusPicker';

const { ERROR, PENDING, PROCESSING, READY, UPLOADING } = uploadState;

const messages = defineMessages({
  filename: {
    defaultMessage: 'Filename',
    description: 'Document filename.',
    id: 'components.DashboardDocument.filename',
  },
  title: {
    defaultMessage: 'Document status',
    description: 'Document upload status.',
    id: 'components.DashboardDocument.title',
  },
});

const DashboardDocumentInnerContainer = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  padding: 1rem;
`;

const DashboardDocumentInternalHeading = styled(DashboardInternalHeading)`
  padding: 0 1rem 0 0;
`;

interface DashboardDocumentProps {
  document: Document;
}

const DashboardDocument = (props: DashboardDocumentProps) => {
  const { document } = useDocument((state) => ({
    document: state.getDocument(props.document),
  }));
  const intl = useIntl();

  useEffect(() => {
    if ([PENDING, UPLOADING, PROCESSING].includes(document.upload_state)) {
      window.setTimeout(async () => {
        await pollForTrack(modelName.DOCUMENTS, document.id);
      }, 1000 * 10);
    }
  }, []);

  const commonStatusLine = (
    <Box align={'center'} direction={'row'}>
      <DashboardDocumentInternalHeading>
        {intl.formatMessage(messages.title)}
      </DashboardDocumentInternalHeading>
      <UploadStatusPicker state={document.upload_state} />
    </Box>
  );

  switch (document.upload_state) {
    case PENDING:
      return (
        <DashboardDocumentInnerContainer>
          {commonStatusLine}
          <DashboardPaneHelptext
            objectType={modelName.DOCUMENTS}
            state={document.upload_state}
          />
          <DashboardPaneButtons
            object={document}
            objectType={modelName.DOCUMENTS}
          />
        </DashboardDocumentInnerContainer>
      );
    case UPLOADING:
      return (
        <DashboardDocumentInnerContainer>
          {commonStatusLine}
          <DashboardObjectProgress objectId={document.id} />
          <DashboardPaneButtons
            object={document}
            objectType={modelName.DOCUMENTS}
          />
        </DashboardDocumentInnerContainer>
      );
    case ERROR:
    case PROCESSING:
      return (
        <DashboardDocumentInnerContainer>
          {commonStatusLine}
          <DashboardPaneButtons
            object={document}
            objectType={modelName.DOCUMENTS}
          />
        </DashboardDocumentInnerContainer>
      );
    case READY:
      return (
        <DashboardDocumentInnerContainer>
          <Box direction={'row'}>
            <Box basis={'1/2'} margin={'small'}>
              {commonStatusLine}
              <DashboardPaneHelptext
                objectType={modelName.DOCUMENTS}
                state={document.upload_state}
              />
              <Box align={'center'} direction={'row'} margin={{ top: 'small' }}>
                <DashboardDocumentInternalHeading>
                  {intl.formatMessage(messages.filename)}
                </DashboardDocumentInternalHeading>
                <div>{document.filename}</div>
              </Box>
            </Box>
            <Box basis={'1/2'} margin={'small'}>
              <DocumentPlayer document={document} />
            </Box>
          </Box>
          <Box margin={'small'}>
            <DashboardDocumentTitleForm document={document} />
          </Box>
          <DashboardPaneButtons
            object={document}
            objectType={modelName.DOCUMENTS}
          />
        </DashboardDocumentInnerContainer>
      );
  }
};

export default DashboardDocument;
