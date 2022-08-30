import { Box, Button } from 'grommet';
import Dropzone from 'react-dropzone';
import React, { useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';

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
      <Dropzone onDrop={onDrop}>
        {({ getRootProps, getInputProps }) => (
          <section>
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <FormattedMessage {...messages.dropzonePlaceholder} />
            </div>
          </section>
        )}
      </Dropzone>
      <ul>
        {filesToUpload.map((file) => (
          <li key={file.name}>
            {file.name} - {bytesToSize(file.size)} {file.type}
          </li>
        ))}
      </ul>
      <Button primary onClick={uploadFiles}>
        <FormattedMessage {...messages.uploadButtonLabel} />
      </Button>
    </Box>
  );
};
