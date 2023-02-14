import { Box, Button, Paragraph, Text } from 'grommet';
import Dropzone from 'react-dropzone';
import React, { useCallback, useEffect, useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { DateTime } from 'luxon';
import { toast } from 'react-hot-toast';

import {
  PlusSVG,
  UploadManagerStatus,
  useUploadManager,
  FileDepositoryModelName as modelName,
  UploadableObjectProgress,
  truncateFilename,
  formatSizeErrorScale,
  report,
} from 'lib-components';

import { depositAppData } from 'apps/deposit/data/depositAppData';
import { useDepositedFiles } from 'apps/deposit/data/queries';
import { createDepositedFile } from 'apps/deposit/data/sideEffects/createDepositedFile';
import { bytesToSize } from 'apps/deposit/utils/bytesToSize';
import { useDepositedFileMetadata } from 'apps/deposit/api/useDepositedFileMetadata';

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
});

export const UploadFiles = () => {
  const intl = useIntl();
  const { refetch: refreshDepositedFiles } = useDepositedFiles(
    depositAppData.fileDepository!.id,
    {},
  );

  const { addUpload, uploadManagerState } = useUploadManager();
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const metadata = useDepositedFileMetadata(intl.locale);

  const uploadsInProgress = Object.values(uploadManagerState).filter((state) =>
    [UploadManagerStatus.INIT, UploadManagerStatus.UPLOADING].includes(
      state.status,
    ),
  );
  const uploadsSucceeded = Object.values(uploadManagerState).filter((state) =>
    [UploadManagerStatus.SUCCESS].includes(state.status),
  );

  const onDrop = (files: any) => {
    setFilesToUpload(filesToUpload.concat(files));
  };

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
      const depositedFile = await createDepositedFile({
        size: file.size,
        filename: file.name,
      });
      addUpload(modelName.DepositedFiles, depositedFile.id, file);
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
  }, [uploadsSucceeded.length, uploading, uploadFiles]);

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
                {intl.formatMessage(messages.uploadingFile)}
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
                    <Text alignSelf="center">{bytesToSize(file.size)}</Text>
                  </Box>
                  <Box justify="end" flex>
                    <Text alignSelf="end">
                      {DateTime.now().toFormat('dd/MM/yyyy')}
                    </Text>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}
        <Dropzone onDrop={onDrop}>
          {({ getRootProps, getInputProps }) => (
            <Box pad="large">
              <div {...getRootProps()}>
                <input {...getInputProps()} />
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
        color="blue-active"
        margin={{ bottom: 'large' }}
        disabled={filesToUpload.length === 0}
      />
    </Box>
  );
};
