import { Anchor, Box, Button, Grid, Paragraph, Text } from 'grommet';
import {
  PlusSVG,
  ValidSVG,
  UploadManagerStatus,
  useUploadManager,
  ClassroomModelName as modelName,
  UploadableObjectProgress,
  truncateFilename,
  Classroom,
} from 'lib-components';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import Dropzone from 'react-dropzone';
import { FormattedMessage, useIntl } from 'react-intl';

import {
  useClassroomDocuments,
  useUpdateClassroomDocument,
} from 'data/queries';
import { createClassroomDocument } from 'data/sideEffects/createClassroomDocument';

const messages = {
  dropzonePlaceholder: {
    defaultMessage: "Drag 'n' drop some files here, or click to select files",
    description: 'Placeholder for dropzone.',
    id: 'apps.classroom.components.DashboardStudent.UploadFiles.dropzonePlaceholder',
  },
  uploadButtonLabel: {
    defaultMessage: 'Upload',
    description: 'Label for upload button.',
    id: 'apps.classroom.components.DashboardStudent.UploadFiles.uploadButtonLabel',
  },
  uploadingFile: {
    defaultMessage:
      'Upload in progress... Please do not close or reload this page.',
    description:
      'Help text to warn user not to navigate away during file upload.',
    id: 'apps.classroom.components.DashboardStudent.UploadFiles.uploadingFile',
  },
  isDefaultDocument: {
    defaultMessage: 'Default document',
    description: 'Helper message for default document.',
    id: 'apps.classroom.components.DashboardStudent.UploadFiles.isDefaultDocument',
  },
  setDefaultDocument: {
    defaultMessage: 'Click to set as default document',
    description: 'Button helper message for setting a document as default.',
    id: 'apps.classroom.components.DashboardStudent.UploadFiles.setDefaultDocument',
  },
  downloadButtonLabel: {
    defaultMessage: 'Download',
    description: 'Label for download button.',
    id: 'apps.classroom.components.DashboardStudent.UploadFiles.downloadButtonLabel',
  },
};

type UploadDocumentsRowReadyProps = {
  isDefault: boolean;
  documentId: string;
  url: string;
};

const UploadDocumentsRowReady = ({
  isDefault,
  documentId,
  url,
}: UploadDocumentsRowReadyProps) => {
  const intl = useIntl();

  const updateClassroomMutation = useUpdateClassroomDocument(documentId);

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

  return (
    <Box direction="row" align="center" gap="small">
      {isDefault ? (
        <ValidSVG iconColor="brand" height="20px" width="20px" />
      ) : (
        <Button
          alignSelf="start"
          onClick={setDefaultDocument}
          title={intl.formatMessage(messages.setDefaultDocument)}
        >
          <ValidSVG iconColor="light-5" height="20px" width="20px" />
        </Button>
      )}
      <Anchor
        download
        a11yTitle={intl.formatMessage(messages.downloadButtonLabel)}
        label={intl.formatMessage(messages.downloadButtonLabel)}
        style={{ fontFamily: 'Roboto-Medium' }}
        title={intl.formatMessage(messages.downloadButtonLabel)}
        href={url}
      />
    </Box>
  );
};

type UploadDocumentsRowProps = {
  filename: string;
  uploadingObjectId?: string;
  children?: React.ReactNode;
};

const UploadDocumentsRow = ({
  filename,
  uploadingObjectId,
  children,
}: UploadDocumentsRowProps) => {
  return (
    <Grid fill>
      <Box
        fill
        background="#F9FBFD"
        pad="small"
        round="small"
        direction={uploadingObjectId ? 'column' : 'row'}
      >
        <Box
          justify={uploadingObjectId ? 'center' : 'start'}
          flex={!uploadingObjectId}
        >
          <Text as="div" weight="bold">
            {truncateFilename(filename, 40)}
          </Text>
        </Box>
        {children}
      </Box>
    </Grid>
  );
};

interface UploadDocumentsProps {
  classroomId: Classroom['id'];
}

export const UploadDocuments = ({ classroomId }: UploadDocumentsProps) => {
  const intl = useIntl();
  const { data: classroomDocuments, refetch: refreshClassroomDocuments } =
    useClassroomDocuments(classroomId, {});

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

  const onDrop = useCallback(
    (files: File[]) => {
      setFilesToUpload(filesToUpload.concat(files));
    },
    [filesToUpload],
  );

  const uploadFiles = useCallback(() => {
    if (!filesToUpload.length) {
      setUploading(false);
    }

    const file = filesToUpload.shift();
    if (!file) {
      return;
    }

    setUploading(true);
    createClassroomDocument({
      filename: file.name,
      size: file.size,
      classroom: classroomId,
    }).then((response) => {
      addUpload(modelName.CLASSROOM_DOCUMENTS, response.id, file);
      refreshClassroomDocuments();
    });
  }, [filesToUpload, addUpload, refreshClassroomDocuments]);

  useEffect(() => {
    if (uploadsSucceeded.length && uploading) {
      uploadFiles();
    }
  }, [uploadFiles, uploading, uploadsSucceeded.length]);

  useEffect(() => {
    const handleClassroomDocumentUpdated = () => {
      refreshClassroomDocuments();
    };

    window.addEventListener(
      'classroomDocumentUpdated',
      handleClassroomDocumentUpdated,
    );
    return () => {
      window.removeEventListener(
        'classroomDocumentUpdated',
        handleClassroomDocumentUpdated,
      );
    };
  }, [refreshClassroomDocuments]);

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
        {classroomDocuments?.results
          .filter(
            (classroomDocument) =>
              uploadsInProgress.find(
                (upload) => upload.objectId === classroomDocument.id,
              ) === undefined,
          )
          .map((classroomDocument) => (
            <UploadDocumentsRow
              key={classroomDocument.id}
              filename={classroomDocument.filename}
            >
              <Box justify="end" flex="shrink" direction="row">
                {classroomDocument.upload_state === 'ready' ? (
                  <UploadDocumentsRowReady
                    isDefault={classroomDocument.is_default}
                    documentId={classroomDocument.id}
                    url={classroomDocument.url}
                  />
                ) : (
                  <Text>{classroomDocument.upload_state}</Text>
                )}
              </Box>
            </UploadDocumentsRow>
          ))}

        {uploadsInProgress.map((state, index) => (
          <UploadDocumentsRow
            key={`${state.file.name}_${index}`}
            filename={state.file.name}
            uploadingObjectId={state.objectId}
          >
            <Fragment>
              <UploadableObjectProgress
                progress={uploadManagerState[state.objectId]?.progress || 0}
              />
              <Text alignSelf="center">
                {intl.formatMessage(messages.uploadingFile)}
              </Text>
            </Fragment>
          </UploadDocumentsRow>
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
                <input
                  {...getInputProps()}
                  aria-label="File Upload"
                  aria-hidden="true"
                />
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
