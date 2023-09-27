import { Box, Button, Paragraph } from 'grommet';
import {
  PlusSVG,
  Text,
  UploadManagerStatus,
  UploadableObjectProgress,
  formatSizeErrorScale,
  FileDepositoryModelName as modelName,
  report,
  truncateFilename,
  useUploadManager,
} from 'lib-components';
import { DateTime } from 'luxon';
import React, { useCallback, useEffect, useState } from 'react';
import Dropzone from 'react-dropzone';
import { toast } from 'react-hot-toast';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';

import { useDepositedFileMetadata } from 'apps/deposit/api/useDepositedFileMetadata';
import { depositAppData } from 'apps/deposit/data/depositAppData';
import { useDepositedFiles } from 'apps/deposit/data/queries';
import { createDepositedFile } from 'apps/deposit/data/sideEffects/createDepositedFile';
import { bytesToSize } from 'apps/deposit/utils/bytesToSize';

const messages = defineMessages({
  dropzonePlaceholder: {
    defaultMessage: "Drag 'n' drop some files here, or click to select files",
    description: 'Placeholder for dropzone.',
    id: 'apps.deposit.components.DashboardStudent.UploadFiles.dropzonePlaceholder',
  },
  uploadButtonLabel: {
    defaultMessage: 'Upload',
    description: 'Label for upload button.',
    id: 'apps.deposit.components.DashboardStudent.UploadFiles.uploadButtonLabel',
  },
  uploadingFile: {
    defaultMessage:
      'Upload in progress... Please do not close or reload this page.',
    description:
      'Help text to warn user not to navigate away during file upload.',
    id: 'apps.deposit.components.DashboardStudent.UploadFiles.uploadingFile',
  },
  errorFileTooLarge: {
    defaultMessage: 'Uploaded files exceeds allowed size of {uploadMaxSize}.',
    description: 'Error message when file is too big.',
    id: 'apps.deposit.components.DashboardStudent.UploadFiles.errorFileTooLarge',
  },
  errorFileUpload: {
    defaultMessage: 'An error occurred when uploading your file. Please retry.',
    description: 'Error message when file upload fails.',
    id: 'apps.deposit.components.DashboardStudent.UploadFiles.errorFileUpload',
  },
  ariaLabelFileUpload: {
    defaultMessage: 'File Upload',
    description: 'The arial-label for the file upload button.',
    id: 'apps.deposit.components.DashboardStudent.UploadFiles.ariaLabelFileUpload',
  },
});

export const UploadFiles = () => {
  const intl = useIntl();
  const { refetch: refreshDepositedFiles } = useDepositedFiles(
    depositAppData.fileDepository?.id || '',
  );

  const { addUpload, uploadManagerState } = useUploadManager();
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const metadata = useDepositedFileMetadata(
    intl.locale,
    depositAppData.fileDepository?.id || '',
  );

  const uploadsInProgress = Object.values(uploadManagerState).filter((state) =>
    [UploadManagerStatus.INIT, UploadManagerStatus.UPLOADING].includes(
      state.status,
    ),
  );
  const uploadsSucceeded = Object.values(uploadManagerState).filter((state) =>
    [UploadManagerStatus.SUCCESS].includes(state.status),
  );

  const uploadFiles = useCallback(async () => {
    if (!filesToUpload.length) {
      setUploading(false);
    }
    const file = filesToUpload.shift();
    if (!file) {
      return;
    }

    setUploading(true);
    try {
      const depositedFile = await createDepositedFile(
        {
          size: file.size,
          filename: file.name,
        },
        depositAppData.fileDepository?.id || '',
      );
      addUpload(
        modelName.DepositedFiles,
        depositedFile.id,
        file,
        depositedFile.file_depository_id,
      );
      refreshDepositedFiles();
    } catch (error) {
      if ((error as object).hasOwnProperty('size') && metadata.data) {
        toast.error(
          intl.formatMessage(messages.errorFileTooLarge, {
            uploadMaxSize: formatSizeErrorScale(
              metadata.data.upload_max_size_bytes,
            ),
          }),
        );
      } else {
        report(error);
        toast.error(intl.formatMessage(messages.errorFileUpload));
      }
    }
  }, [addUpload, filesToUpload, intl, metadata.data, refreshDepositedFiles]);

  useEffect(() => {
    if (uploading) {
      if (filesToUpload.length > 0) {
        uploadFiles();
      } else {
        setUploading(false);
      }
    }
  }, [uploadsSucceeded.length, filesToUpload.length, uploadFiles, uploading]);

  return (
    <Box>
      <Box
        align="center"
        background="blue-message"
        fill
        border={{
          style: filesToUpload.length === 0 ? 'dashed' : 'solid',
          size: 'small',
          color: 'blue-active',
        }}
        margin={{ bottom: 'large' }}
        round="small"
      >
        {uploadsInProgress.length > 0 && (
          <Box fill>
            {uploadsInProgress.map((state) => (
              <Box
                key={state.objectId}
                fill
                background="#F9FBFD"
                pad="large"
                align="center"
                margin={{ bottom: 'xsmall' }}
              >
                <Text weight="bold">
                  {truncateFilename(state.file.name, 40)}
                </Text>
                <UploadableObjectProgress
                  progress={uploadManagerState[state.objectId].progress}
                />
                <Text size="small">
                  {intl.formatMessage(messages.uploadingFile)}
                </Text>
              </Box>
            ))}
          </Box>
        )}
        {filesToUpload.length !== 0 && (
          <Box fill>
            {filesToUpload.map((file) => (
              <Box
                key={file.name}
                fill
                background="#F9FBFD"
                pad="medium"
                margin={{ bottom: 'xsmall' }}
                round="small"
              >
                <Box justify="start" margin={{ bottom: 'xsmall' }}>
                  <Text weight="bold">{truncateFilename(file.name, 40)}</Text>
                </Box>
                <Box direction="row">
                  <Box justify="start" flex="shrink">
                    <Text textAlign="center">{bytesToSize(file.size)}</Text>
                  </Box>
                  <Box justify="end" flex>
                    <Text textAlign="end">
                      {DateTime.now().toFormat('dd/MM/yyyy')}
                    </Text>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}
        <Dropzone
          onDrop={(files) => {
            setFilesToUpload(filesToUpload.concat(files));
          }}
        >
          {({ getRootProps, getInputProps }) => (
            <Box pad="large">
              <div {...getRootProps()}>
                <input
                  {...getInputProps()}
                  aria-label={intl.formatMessage(messages.ariaLabelFileUpload)}
                />
                <Box
                  direction={filesToUpload.length === 0 ? 'column' : 'row'}
                  align="center"
                  gap="medium"
                >
                  {filesToUpload.length === 0 ? (
                    <PlusSVG iconColor="#75A7E5" height="100px" width="100px" />
                  ) : (
                    <PlusSVG iconColor="#75A7E5" height="45px" width="45px" />
                  )}
                  <Paragraph color="#75A7E5" textAlign="center" margin="none">
                    <FormattedMessage {...messages.dropzonePlaceholder} />
                  </Paragraph>
                </Box>
              </div>
            </Box>
          )}
        </Dropzone>
      </Box>

      <Button
        primary
        onClick={() => {
          void uploadFiles();
        }}
        label={intl.formatMessage(messages.uploadButtonLabel)}
        margin={{ bottom: 'large' }}
        disabled={filesToUpload.length === 0}
      />
    </Box>
  );
};
