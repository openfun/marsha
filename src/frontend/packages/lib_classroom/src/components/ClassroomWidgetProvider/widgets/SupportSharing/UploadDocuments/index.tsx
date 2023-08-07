import { Box, Button, Paragraph, Text } from 'grommet';
import { Nullable } from 'lib-common';
import {
  Classroom,
  PlusSVG,
  UploadManagerStatus,
  formatSizeErrorScale,
  ClassroomModelName as modelName,
  report,
  useUploadManager,
} from 'lib-components';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Dropzone from 'react-dropzone';
import { toast } from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import {
  useClassroomDocumentMetadata,
  useClassroomDocuments,
} from '@lib-classroom/data/queries';
import { createClassroomDocument } from '@lib-classroom/data/sideEffects/createClassroomDocument';

import { DocumentRow } from './DocumentRow';

const messages = defineMessages({
  dropzonePlaceholder: {
    defaultMessage: "Drag 'n' drop some files here, or click to select files",
    description: 'Placeholder for dropzone.',
    id: 'apps.classroom.components.DashboardStudent.UploadFiles.dropzonePlaceholder',
  },
  dropzoneTitle: {
    defaultMessage: 'Upload files to your classroom:',
    description: 'Title for the dropzone.',
    id: 'apps.classroom.components.DashboardStudent.UploadFiles.dropzoneTitle',
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
  errorFileTooLarge: {
    defaultMessage: 'Uploaded files exceeds allowed size of {uploadMaxSize}.',
    description: 'Error message when file is too big.',
    id: 'apps.classroom.components.DashboardStudent.UploadFiles.errorFileTooLarge',
  },
  errorFileUpload: {
    defaultMessage: 'An error occurred when uploading your file. Please retry.',
    description: 'Error message when file upload fails.',
    id: 'apps.classroom.components.DashboardStudent.UploadFiles.errorFileUpload',
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
});

interface UploadDocumentsProps {
  classroomId: Classroom['id'];
}

export const UploadDocuments = ({ classroomId }: UploadDocumentsProps) => {
  const intl = useIntl();
  const { data: classroomDocuments, refetch: refreshClassroomDocuments } =
    useClassroomDocuments(classroomId, {});
  const metadata = useClassroomDocumentMetadata(classroomId, intl.locale);

  const { addUpload, uploadManagerState } = useUploadManager();
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const hiddenFileInput = React.useRef<Nullable<HTMLInputElement>>(null);
  const retryUploadIdRef = useRef<Nullable<string>>(null);
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

  const onRetryFailedUpload = (classroomDocumentId: string) => {
    if (hiddenFileInput.current) {
      retryUploadIdRef.current = classroomDocumentId;
      hiddenFileInput.current.click();
    }
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
      const document = await createClassroomDocument({
        filename: file.name,
        size: file.size,
        classroom_id: classroomId,
      });
      addUpload(
        modelName.CLASSROOM_DOCUMENTS,
        document.id,
        file,
        modelName.CLASSROOMS,
        classroomId,
      );
      refreshClassroomDocuments();
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
  }, [
    addUpload,
    classroomId,
    filesToUpload,
    intl,
    metadata.data,
    refreshClassroomDocuments,
  ]);

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
      <Text
        color="blue-active"
        size="0.875rem"
        style={{ fontFamily: 'Roboto-Medium' }}
      >
        {intl.formatMessage(messages.dropzoneTitle)}
      </Text>
      <Box
        align="center"
        background="blue-message"
        fill
        border={{
          style: filesToUpload.length === 0 ? 'dashed' : 'solid',
          size: 'xsmall',
          color: 'blue-active',
        }}
        margin={{ top: 'small' }}
        pad={{ vertical: 'small' }}
        round="xsmall"
      >
        {classroomDocuments?.results
          .filter(
            (classroomDocument) =>
              uploadsInProgress.find(
                (upload) => upload.objectId === classroomDocument.id,
              ) === undefined,
          )
          .map((classroomDocument, index) => (
            <DocumentRow
              key={index}
              document={classroomDocument}
              uploadingObject={Object.values(uploadManagerState).find(
                (uploadingObject) =>
                  uploadingObject.objectId === classroomDocument.id,
              )}
              onRetryFailedUpload={onRetryFailedUpload}
            />
          ))}

        {filesToUpload.map((file, index) => (
          <Text key={`${file.name}_${index}`}>{file.name}</Text>
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
                <Box direction="row" align="center">
                  <PlusSVG iconColor="#75A7E5" height="35px" width="35px" />
                  <Paragraph color="#75A7E5" textAlign="center" margin="none">
                    {intl.formatMessage(messages.dropzonePlaceholder)}
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
          onClick={() => {
            void uploadFiles();
          }}
          label={intl.formatMessage(messages.uploadButtonLabel)}
          color="blue-active"
          margin={{ top: 'small' }}
        />
      )}
    </Box>
  );
};
