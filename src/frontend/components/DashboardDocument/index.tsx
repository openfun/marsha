import { Box, Button, Form, FormField, Text, TextInput } from 'grommet';
import React, { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { pollForTrack } from '../../data/sideEffects/pollForTrack';
import { updateResource } from '../../data/sideEffects/updateResource';
import { useDocument } from '../../data/stores/useDocument';
import { Document } from '../../types/file';
import { modelName } from '../../types/models';
import { uploadState } from '../../types/tracks';
import { Maybe } from '../../utils/types';
import { DashboardInternalHeading } from '../Dashboard/DashboardInternalHeading';
import { DashboardObjectProgress } from '../DashboardObjectProgress';
import { DashboardPaneButtons } from '../DashboardPaneButtons';
import { DashboardPaneHelptext } from '../DashboardPaneHelptext';
import DocumentPlayer from '../DocumentPlayer';
import { DOCUMENT_PLAYER_ROUTE } from '../DocumentPlayer/route';
import { UploadStatusPicker } from '../UploadStatusPicker';

const { ERROR, PENDING, PROCESSING, READY, UPLOADING } = uploadState;

const messages = defineMessages({
  title: {
    defaultMessage: 'Document status',
    description: 'Document upload status.',
    id: 'components.DashboardDocument.title',
  },
  updateError: {
    defaultMessage: 'Impossible to update the title. Try again later.',
    description:
      'Error message to warn the user that a title update failed and ask them to try again later.',
    id: 'components.DashboardDocument.form.label.error',
  },
  updateSuccessful: {
    defaultMessage: 'Title successfully updated',
    description: 'message display when the title is successfully updated',
    id: 'components.DashboardDocument.form.success',
  },
  updateTitle: {
    defaultMessage: 'Change document title',
    description: 'Label informing the user they can change the document title.',
    id: 'components.DashboardDocument.form.label.title',
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
  const { document, updateDocument } = useDocument(state => ({
    document: state.getDocument(props.document),
    updateDocument: state.addResource,
  }));
  const [title, setTitle] = useState(document.title);
  const [error, setError] = useState<Maybe<string>>(undefined);
  const [udpated, setUpdated] = useState(false);
  const intl = useIntl();

  useEffect(() => {
    if ([PENDING, UPLOADING, PROCESSING].includes(document.upload_state)) {
      window.setTimeout(async () => {
        await pollForTrack(modelName.DOCUMENTS, document.id);
      }, 1000 * 10);
    }
  }, []);

  const updateTitle = async () => {
    try {
      setUpdated(false);
      const newDocument = await updateResource(
        {
          ...document,
          title,
        },
        modelName.DOCUMENTS,
      );
      setError(undefined);
      setUpdated(true);
      updateDocument(newDocument);
    } catch (error) {
      setError(intl.formatMessage(messages.updateError));
      setUpdated(false);
    }
  };

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
            routePlayer={DOCUMENT_PLAYER_ROUTE()}
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
            routePlayer={DOCUMENT_PLAYER_ROUTE()}
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
            routePlayer={DOCUMENT_PLAYER_ROUTE()}
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
            </Box>
            <Box basis={'1/2'} margin={'small'}>
              <DocumentPlayer document={document} />
            </Box>
          </Box>
          <Box margin={'small'}>
            <Form onSubmit={updateTitle}>
              <FormField
                label={intl.formatMessage(messages.updateTitle)}
                htmlFor={'title'}
                error={error}
                component={TextInput}
              >
                <TextInput
                  placeholder="Title"
                  value={title}
                  onChange={event => setTitle(event.target.value)}
                  size={'medium'}
                  id={'title'}
                />
              </FormField>
              <Button type="submit" primary label="Submit" />
              {udpated && (
                <Text margin={'small'} color={'status-ok'}>
                  {intl.formatMessage(messages.updateSuccessful)}
                </Text>
              )}
            </Form>
          </Box>
          <DashboardPaneButtons
            object={document}
            objectType={modelName.DOCUMENTS}
            routePlayer={DOCUMENT_PLAYER_ROUTE()}
          />
        </DashboardDocumentInnerContainer>
      );
  }
};

export default DashboardDocument;
