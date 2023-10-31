import { Button } from '@openfun/cunningham-react';
import { Anchor } from 'grommet';
import {
  BinSVG,
  Box,
  ClassroomDocument,
  ObjectStatusPicker,
  RetryUploadButton,
  Text,
  UploadingObject,
  ValidSVG,
  uploadState,
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
  const updateClassroomMutation = useUpdateClassroomDocument(
    document.classroom_id,
    document.id,
  );
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
    deleteDocumentMutation.mutate(
      {
        classroomId: document.classroom_id,
        classroomDocumentId: document.id,
      },
      {
        onSuccess: () => {
          window.dispatchEvent(new CustomEvent('classroomDocumentUpdated'));
        },
      },
    );
  }, [deleteDocumentMutation, document.classroom_id, document.id]);

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
      justify="space-between"
      pad={{ vertical: 'small' }}
      gap="xxsmall"
    >
      <Box direction="row" align="center" gap="small">
        <Button
          aria-label={intl.formatMessage(messages.buttonLabel)}
          onClick={() => setDeleteDocument()}
          style={{ display: 'flex' }}
          icon={<BinSVG height="18px" iconColor="blue-active" width="14px" />}
          color="tertiary"
        />
      </Box>

      <Box width={{ min: 'none' }}>
        <StyledAnchor
          a11yTitle={title}
          download={document.filename}
          href={document.url || undefined}
          // The click on the title triggers download of the associated upload. But this
          // behavior should be possible only if upload is complete and finished
          isClickable={document.upload_state === uploadState.READY}
          label={
            <Box>
              <Text truncate weight="extrabold">
                {title}
              </Text>
            </Box>
          }
          rel="noopener"
          target="_blank"
          title={title}
        />
      </Box>

      <Box direction="row" align="center" gap="small">
        {document.upload_state === uploadState.READY && (
          <Button
            onClick={setDefaultDocument}
            aria-label={intl.formatMessage(messages.setDefaultDocument)}
            aria-selected={document.is_default}
            role="row"
            title={intl.formatMessage(messages.setDefaultDocument)}
            disabled={
              document.upload_state !== uploadState.READY || document.is_default
            }
            icon={
              <ValidSVG
                iconColor={document.is_default ? 'brand' : 'light-5'}
                height="20px"
                width="20px"
              />
            }
            color="tertiary"
          />
        )}
      </Box>

      {document.upload_state !== uploadState.READY && (
        <Box
          align="center"
          direction="row"
          justify="center"
          style={{ flex: 'none' }}
        >
          {isUploadInProgress ? (
            <ObjectStatusPicker
              object={document}
              uploadStatus={uploadingObject?.status}
            />
          ) : (
            <React.Fragment>
              <Box>
                <Text color="clr-danger-300" weight="medium">
                  {intl.formatMessage(messages.retryUploadFailedLabel)}
                </Text>
              </Box>

              <RetryUploadButton
                color="red-active"
                onClick={() => onRetryFailedUpload(document.id)}
              />
            </React.Fragment>
          )}
        </Box>
      )}
    </Box>
  );
};
