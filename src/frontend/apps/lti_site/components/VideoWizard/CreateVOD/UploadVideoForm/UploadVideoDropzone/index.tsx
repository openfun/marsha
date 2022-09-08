import { Box, Text } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { RoundPlusSVG } from 'lib-components';
import React from 'react';
import { useDropzone } from 'react-dropzone';
import { defineMessages, useIntl } from 'react-intl';

import { BigDashedBox } from 'components/VideoWizard/CreateVOD/UploadVideoForm/BigDashedBox';
import { theme } from 'utils/theme/theme';

const messages = defineMessages({
  uploadVideoDropzoneLabel: {
    defaultMessage: 'Add a video or drag & drop it',
    description: 'Label used on the upload form, which describes its role.',
    id: 'components.UploadVideoDropzone.uploadVideoDropzoneLabel',
  },
});

interface UploadVideoDropzoneProps {
  setVideoFile: (videoFile: File) => void;
}

export const UploadVideoDropzone = ({
  setVideoFile,
}: UploadVideoDropzoneProps) => {
  const intl = useIntl();
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'video/*': [] },
    maxFiles: 1,
    onDrop: (files: File[]) => setVideoFile(files[0]),
  });

  return (
    <BigDashedBox
      background={
        !isDragActive ? normalizeColor('bg-select', theme) : '#b4cff2'
      }
      pad="0px"
    >
      <Box
        align="center"
        fill
        gap="small"
        pad={{ horizontal: 'medium', vertical: 'large' }}
        style={{ cursor: 'pointer', boxShadow: 'none' }}
        {...getRootProps()}
      >
        <RoundPlusSVG
          containerStyle={{
            display: 'flex',
          }}
          height="40px"
          iconColor={!isDragActive ? '#b4cff2' : 'white'}
          width="40px"
        />
        <Text
          color={!isDragActive ? '#b4cff2' : 'white'}
          size="1rem"
          textAlign="center"
        >
          {intl.formatMessage(messages.uploadVideoDropzoneLabel)}
        </Text>
        <input data-testid="input-video-test-id" {...getInputProps()} />
      </Box>
    </BigDashedBox>
  );
};
