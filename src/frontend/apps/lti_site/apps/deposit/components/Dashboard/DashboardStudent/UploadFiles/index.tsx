import { Box, Button, Grid, Paragraph, Text } from 'grommet';
import Dropzone from 'react-dropzone';
import React, { useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { DateTime } from 'luxon';

import { PlusSVG } from 'lib-components';
import { useUploadManager } from 'components/UploadManager';
import { Nullable } from 'utils/types';

import { depositAppData } from 'apps/deposit/data/depositAppData';
import { useDepositedFiles } from 'apps/deposit/data/queries';
import { createDepositedFile } from 'apps/deposit/data/sideEffects/createDepositedFile';
import { modelName } from 'apps/deposit/types/models';
import { bytesToSize } from 'apps/deposit/utils/bytesToSize';

const messages = {
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
};

export const UploadFiles = () => {
  const intl = useIntl();
  const { refetch: refreshDepositedFiles } = useDepositedFiles(
    depositAppData.fileDepository!.id,
    {},
  );
  const retryUploadIdRef = useRef<Nullable<string>>(null);

  const { addUpload } = useUploadManager();
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);

  const onDrop = (files: any) => {
    setFilesToUpload(filesToUpload.concat(files));
  };

  const uploadFiles = () => {
    filesToUpload.forEach(async (file) => {
      let depositedFileId;
      if (!retryUploadIdRef.current) {
        const response = await createDepositedFile();
        depositedFileId = response.id;
      } else {
        depositedFileId = retryUploadIdRef.current;
        retryUploadIdRef.current = null;
      }
      addUpload(modelName.DepositedFiles, depositedFileId, file);
      filesToUpload.pop();
      await refreshDepositedFiles();
    });
  };

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
        {filesToUpload.length !== 0 && (
          <Box fill>
            {filesToUpload.map((file) => (
              <Box
                key={file.name}
                direction="row"
                fill
                background="#F9FBFD"
                pad="large"
                align="center"
                margin={{ bottom: 'xsmall' }}
              >
                <Grid columns={{ count: 3, size: 'small' }} fill>
                  <Box justify="start">
                    <Text weight="bold">{file.name}</Text>
                  </Box>
                  <Box justify="center">
                    <Text alignSelf="center">{bytesToSize(file.size)}</Text>
                  </Box>
                  <Box justify="end">
                    <Text alignSelf="end">
                      {DateTime.now().toFormat('dd/MM/yyyy')}
                    </Text>
                  </Box>
                </Grid>
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
        onClick={uploadFiles}
        label={intl.formatMessage(messages.uploadButtonLabel)}
        color="blue-active"
        margin={{ bottom: 'large' }}
        disabled={filesToUpload.length === 0}
      />
    </Box>
  );
};
