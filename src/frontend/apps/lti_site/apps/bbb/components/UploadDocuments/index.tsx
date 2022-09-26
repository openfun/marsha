import { Anchor, Box, Button, Paragraph, Text } from 'grommet';
import Dropzone from 'react-dropzone';
import React, { useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { PlusSVG } from 'lib-components';
import { UploadableObjectProgress } from 'components/UploadableObjectProgress';
import {
  UploadManagerStatus,
  useUploadManager,
} from 'components/UploadManager';

import { bbbAppData } from 'apps/bbb/data/bbbAppData';
import { useClassroomDocuments } from 'apps/bbb/data/queries';
import { createClassroomDocument } from 'apps/bbb/data/sideEffects/createClassroomDocument';
import { modelName } from 'apps/bbb/types/models';
import { truncateFilename } from 'apps/deposit/utils/truncateFilename';

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
  uploadingFile: {
    defaultMessage:
      'Upload in progress... Please do not close or reload this page.',
    description:
      'Help text to warn user not to navigate away during file upload.',
    id: 'apps.deposit.components.DashboardStudent.UploadFiles.uploadingFile',
  },
  downloadButtonLabel: {
    defaultMessage: 'Download',
    description: 'Label for download button.',
    id: 'apps.deposit.components.DashboardStudent.UploadFiles.downloadButtonLabel',
  },
};

type UploadDocumentsRowProps = {
  filename: string;
  uploadingObjectId?: string;
  uploadState?: string;
  url?: string;
};

const UploadDocumentsRow = ({
  filename,
  uploadingObjectId,
  uploadState,
  url,
}: UploadDocumentsRowProps) => {
  const intl = useIntl();
  return (
    <Box fill background="#F9FBFD" pad="small" round="small" direction="row">
      <Box justify="start" flex>
        <Text weight="bold">{truncateFilename(filename, 40)}</Text>
      </Box>
      {uploadingObjectId && (
        <React.Fragment>
          <UploadableObjectProgress objectId={uploadingObjectId} />
          {intl.formatMessage(messages.uploadingFile)}
        </React.Fragment>
      )}
      {uploadState && (
        <Box justify="end" flex="shrink">
          {uploadState === 'ready' ? (
            <Anchor
              download
              a11yTitle={intl.formatMessage(messages.downloadButtonLabel)}
              label={intl.formatMessage(messages.downloadButtonLabel)}
              style={{ fontFamily: 'Roboto-Medium' }}
              title={intl.formatMessage(messages.downloadButtonLabel)}
              href={url}
            />
          ) : (
            <Text>{uploadState}</Text>
          )}
        </Box>
      )}
    </Box>
  );
};

export const UploadDocuments = () => {
  const intl = useIntl();
  const { data: classroomDocuments, refetch: refreshClassroomDocuments } =
    useClassroomDocuments(bbbAppData.classroom!.id, {});

  const { addUpload, uploadManagerState } = useUploadManager();
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

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

  const uploadFiles = () => {
    const file = filesToUpload.shift();
    if (!file) {
      return;
    }

    setUploading(true);
    createClassroomDocument({
      filename: file.name,
      size: file.size,
    }).then((response) => {
      addUpload(modelName.CLASSROOM_DOCUMENTS, response.id, file);
      refreshClassroomDocuments();
    });
  };

  useEffect(() => {
    if (uploading) {
      if (filesToUpload.length > 0) {
        uploadFiles();
      } else {
        setUploading(false);
      }
    }
  }, [uploadsSucceeded.length]);

  return (
    <Box>
      <Box
        align="center"
        background="blue-message"
        fill
        border={{
          style: filesToUpload.length === 0 ? 'dashed' : 'solid',
          size: 'xsmall',
          color: 'blue-active',
        }}
        margin={{ top: 'medium' }}
        round="xsmall"
      >
        {classroomDocuments?.results.map((classroomDocument) => (
          <UploadDocumentsRow
            key={classroomDocument.id}
            filename={classroomDocument.filename}
            uploadState={classroomDocument.upload_state}
            url={classroomDocument.url}
          />
        ))}

        {uploadsInProgress.map((state, index) => (
          <UploadDocumentsRow
            key={`${state.file.name}_${index}`}
            filename={state.file.name}
            uploadingObjectId={state.objectId}
          />
        ))}

        {filesToUpload.map((file, index) => (
          <UploadDocumentsRow
            key={`${file.name}_${index}`}
            filename={file.name}
          />
        ))}

        <Box fill align="center" pad="small">
          <Dropzone onDrop={onDrop} accept={{ 'application/pdf': ['.pdf'] }}>
            {({ getRootProps, getInputProps }) => (
              <div {...getRootProps()}>
                <input {...getInputProps()} />
                <Box direction="row" align="center" gap="medium">
                  <PlusSVG iconColor="#75A7E5" height="35px" width="35px" />
                  <Paragraph color="#75A7E5" textAlign="center" margin="none">
                    <FormattedMessage {...messages.dropzonePlaceholder} />
                  </Paragraph>
                </Box>
              </div>
            )}
          </Dropzone>
        </Box>
      </Box>

      {filesToUpload.length > 0 && (
        <Button
          primary
          onClick={uploadFiles}
          label={intl.formatMessage(messages.uploadButtonLabel)}
          color="blue-active"
          margin={{ top: 'small' }}
        />
      )}
    </Box>
  );
};
