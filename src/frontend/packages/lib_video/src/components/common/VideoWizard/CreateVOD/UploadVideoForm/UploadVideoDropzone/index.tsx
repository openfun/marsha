import { colorsTokens } from 'lib-common';
import { Box, RoundPlusSVG, Text } from 'lib-components';
import React from 'react';
import { useDropzone } from 'react-dropzone';
import { defineMessages, useIntl } from 'react-intl';

import { BigDashedBox } from '../BigDashedBox';

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
      background={!isDragActive ? colorsTokens['primary-150'] : '#b4cff2'}
      pad="0px"
    >
      <Box
        align="center"
        fill
        gap="small"
        pad={{ horizontal: 'medium', vertical: 'large' }}
        style={{ cursor: 'pointer', boxShadow: 'none' }}
        {...(typeof getRootProps() === 'object' ? getRootProps() : {})}
      >
        <RoundPlusSVG
          containerStyle={{
            display: 'flex',
          }}
          height="40px"
          iconColor={!isDragActive ? '#b4cff2' : 'white'}
          width="40px"
        />
        <Text color={!isDragActive ? '#b4cff2' : 'white'} textAlign="center">
          {intl.formatMessage(messages.uploadVideoDropzoneLabel)}
        </Text>
        <input data-testid="input-video-test-id" {...getInputProps()} />
      </Box>
    </BigDashedBox>
  );
};
