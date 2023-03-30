import { Anchor, Box, Button, Text } from 'grommet';
import {
  UploadingObject,
  uploadState,
  ObjectStatusPicker,
  RetryUploadButton,
  BinSVG,
  ClassroomDocument,
  ValidSVG,
} from 'lib-components';
import React, { useCallback, useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import {
  useDeleteClassroomDocument,
  useUpdateClassroomDocument,
} from '@lib-classroom/data';

const StyledAnchor = styled(Anchor)`
  cursor: ${({ isClickable }: { isClickable: boolean }) =>
    isClickable ? 'pointer' : 'auto'};
  font-family: Roboto-Medium;

  &:hover {
    text-decoration: ${({ isClickable }: { isClickable: boolean }) =>
      isClickable ? 'underline' : undefined};
  }
`;

const messages = defineMessages({
  retryUploadFailedLabel: {
    defaultMessage: 'Retry',
    description:
      'Label of the button allowing to retry upload when it has failed.',
    id: 'component.SharedLiveMediaItem.retryUploadFailedLabel',
  },
  buttonLabel: {
    defaultMessage: 'Click on this button to delete the media.',
    description: 'The label of the button to delete a media.',
    id: 'components.DeleteSharedLiveMediaButton.buttonLabel',
  },
  noFilenameUploadFailed: {
    defaultMessage: 'Upload has failed',
    description:
      "A message displayed when upload has failed, and so the file hasn't any filename.",
    id: 'component.TitleDisplayer.noFilenameUploadFailed',
  },
  setDefaultDocument: {
    defaultMessage: 'Click to set as default document',
    description: 'Button helper message for setting a document as default.',
    id: 'apps.classroom.components.DashboardStudent.UploadFiles.setDefaultDocument',
  },
});

interface DocumentRowProps {
  onRetryFailedUpload: (classroomDocumentId: ClassroomDocument['id']) => void;
  document: ClassroomDocument;
  uploadingObject?: UploadingObject;
}

export const DocumentRow = ({
  onRetryFailedUpload,
  document,
  uploadingObject,
}: DocumentRowProps) => {
  const intl = useIntl();
  const updateClassroomMutation = useUpdateClassroomDocument(document.id);
  const deleteDocumentMutation = useDeleteClassroomDocument();
  const [isUploadInProgress, setIsUploadInProgress] = useState<boolean>(false);

  const title =
    document.filename || intl.formatMessage(messages.noFilenameUploadFailed);

  const setDefaultDocument = useCallback(() => {
    if (!updateClassroomMutation) {
      return;
    }

    updateClassroomMutation.mutate(
      { is_default: true },
      {
        onSuccess: () => {
          window.dispatchEvent(new CustomEvent('classroomDocumentUpdated'));
        },
      },
    );
  }, [updateClassroomMutation]);

  const setDeleteDocument = useCallback(() => {
    deleteDocumentMutation.mutate(document.id, {
      onSuccess: () => {
        window.dispatchEvent(new CustomEvent('classroomDocumentUpdated'));
      },
    });
  }, [deleteDocumentMutation, document.id]);

  useEffect(() => {
    (document.upload_state === uploadState.PENDING && uploadingObject) ||
    document.upload_state === uploadState.PROCESSING
      ? setIsUploadInProgress(true)
      : setIsUploadInProgress(false);
  }, [document.upload_state, uploadingObject]);

  return (
    <Box
      direction="row"
      align="center"
      fill="horizontal"
      height="60px"
      gap="medium"
      pad={{ horizontal: 'small', vertical: 'small' }}
    >
      <Box direction="row" align="center" gap="small">
        <Button
          a11yTitle={intl.formatMessage(messages.buttonLabel)}
          onClick={() => setDeleteDocument()}
          plain
          style={{ display: 'block', padding: 0 }}
        >
          <BinSVG height="18px" iconColor="blue-active" width="14px" />
        </Button>
      </Box>

      <Box style={{ minWidth: '0' }} direction="row" align="center" gap="small">
        <Box style={{ minWidth: '0' }}>
          <StyledAnchor
            a11yTitle={title}
            download={document.filename}
            href={document.url || undefined}
            // The click on the title triggers download of the associated upload. But this
            // behavior should be possible only if upload is complete and finished
            isClickable={document.upload_state === uploadState.READY}
            label={
              <Box style={{ minWidth: '0' }}>
                <Text color="blue-active" size="0.9rem" truncate>
                  {title}
                </Text>
              </Box>
            }
            rel="noopener"
            target="_blank"
            title={title}
          />
        </Box>
        {document.is_default ? (
          <ValidSVG iconColor="brand" height="20px" width="20px" />
        ) : (
          <Button
            alignSelf="start"
            onClick={setDefaultDocument}
            title={intl.formatMessage(messages.setDefaultDocument)}
            disabled={document.upload_state !== uploadState.READY}
          >
            <ValidSVG iconColor="light-5" height="20px" width="20px" />
          </Button>
        )}
      </Box>

      <Box
        align="center"
        direction="row"
        justify="center"
        margin={{ left: 'auto' }}
      >
        {document.upload_state !== uploadState.READY &&
          (isUploadInProgress ? (
            <Text
              color="blue-active"
              size="0.9rem"
              style={{ fontFamily: 'Roboto-Medium' }}
              truncate
            >
              <ObjectStatusPicker
                object={document}
                uploadStatus={uploadingObject?.status}
              />
            </Text>
          ) : (
            <React.Fragment>
              <Box>
                <Text
                  color="red-active"
                  size="0.9rem"
                  style={{ fontFamily: 'Roboto-Medium' }}
                >
                  {intl.formatMessage(messages.retryUploadFailedLabel)}
                </Text>
              </Box>

              <RetryUploadButton
                color="red-active"
                onClick={() => onRetryFailedUpload(document.id)}
              />
            </React.Fragment>
          ))}
      </Box>
    </Box>
  );
};