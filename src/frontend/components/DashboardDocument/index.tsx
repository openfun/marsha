import { Box } from 'grommet';
import React, { useEffect } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { pollForTrack } from '../../data/sideEffects/pollForTrack';
import { useDocument } from '../../data/stores/useDocument';
import { Document } from '../../types/file';
import { ModelName } from '../../types/models';
import { UploadState } from '../../types/tracks';
import { DashboardInternalHeading } from '../Dashboard/DashboardInternalHeading';
import { DashboardDocumentTitleForm } from '../DashboardDocumentTitleForm';
import { DashboardObjectProgress } from '../DashboardObjectProgress';
import { DashboardPaneButtons } from '../DashboardPaneButtons';
import DocumentPlayer from '../DocumentPlayer';
import { ObjectStatusPicker } from '../ObjectStatusPicker';

const { ERROR, PENDING, PROCESSING, READY, UPLOADING } = UploadState;

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
  [ERROR]: {
    defaultMessage:
      'There was an error with your document. Retry or upload another one.',
    description:
      'Dashboard helptext for when the document failed to upload or get processed.',
    id: 'components.DashboardDocument.helptextError',
  },
  [PENDING]: {
    defaultMessage: 'There is currently no document to display.',
    description:
      'Dashboard helptext for the case when there is no existing document nor anything in progress.',
    id: 'components.DashboardDocument.helptextPending',
  },
  [PROCESSING]: {
    defaultMessage:
      'Your document is currently processing. This may take some minutes.',
    description: 'Dashboard helptext to warn users document is processing.',
    id: 'components.DashboardDocument.helptextProcessing',
  },
  [READY]: {
    defaultMessage: 'Your document is ready to display.',
    description: 'Dashboard helptext for ready-to-display documents.',
    id: 'components.DashboardDocument.helptextReady',
  },
  [UPLOADING]: {
    defaultMessage:
      'Upload in progress... Please do not close or reload this page.',
    description:
      'Dashboard helptext to warn user not to navigate away during document upload.',
    id: 'components.DashboardDocument.helptextUploading',
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
        await pollForTrack(ModelName.DOCUMENTS, document.id);
      }, 1000 * 10);
    }
  }, []);

  const CommonStatusLine = () => (
    <Box align="center" direction="row">
      <DashboardDocumentInternalHeading>
        {intl.formatMessage(messages.title)}
      </DashboardDocumentInternalHeading>
      <ObjectStatusPicker state={document.upload_state} />
    </Box>
  );

  switch (document.upload_state) {
    case UPLOADING:
      return (
        <DashboardDocumentInnerContainer>
          <CommonStatusLine />
          <DashboardObjectProgress objectId={document.id} />
          <DashboardPaneButtons
            object={document}
            objectType={ModelName.DOCUMENTS}
          />
        </DashboardDocumentInnerContainer>
      );
    case ERROR:
    case PROCESSING:
      return (
        <DashboardDocumentInnerContainer>
          <CommonStatusLine />
          <DashboardPaneButtons
            object={document}
            objectType={ModelName.DOCUMENTS}
          />
        </DashboardDocumentInnerContainer>
      );
    case READY:
      return (
        <DashboardDocumentInnerContainer>
          <Box direction="row">
            <Box basis="1/2" margin="small">
              <CommonStatusLine />
              {intl.formatMessage(messages[READY])}
              <Box align="center" direction="row" margin={{ top: 'small' }}>
                <DashboardDocumentInternalHeading>
                  {intl.formatMessage(messages.filename)}
                </DashboardDocumentInternalHeading>
                <div>{document.filename}</div>
              </Box>
            </Box>
            <Box basis="1/2" margin="small">
              <DocumentPlayer document={document} />
            </Box>
          </Box>
          <Box margin="small">
            <DashboardDocumentTitleForm document={document} />
          </Box>
          <DashboardPaneButtons
            object={document}
            objectType={ModelName.DOCUMENTS}
          />
        </DashboardDocumentInnerContainer>
      );
    default:
      return (
        <DashboardDocumentInnerContainer>
          <CommonStatusLine />
          {document.upload_state === PENDING &&
            intl.formatMessage(messages[PENDING])}
          <DashboardPaneButtons
            object={document}
            objectType={ModelName.DOCUMENTS}
          />
        </DashboardDocumentInnerContainer>
      );
  }
};

export default DashboardDocument;
