import { Maybe } from 'lib-common';
import React, { useState } from 'react';
import Dropzone from 'react-dropzone';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { useUploadManager } from '@lib-components/common/UploadManager';
import { uploadableModelName } from '@lib-components/types/models';

import { DropzonePlaceholder } from './DropzonePlaceholder';

const messages = defineMessages({
  ariaLabel: {
    defaultMessage: 'File Upload',
    description: 'Aria Label Dropzone.',
    id: 'common.UploadField.ariaLabel',
  },
});

const DropzoneStyled = styled.div`
  display: flex; /* For the dropzone contents */
  flex-grow: 1;
`;

export interface UploadFieldProps {
  objectType: uploadableModelName;
  objectId: string;
  parentId?: Maybe<string>;
}

export const UploadField = ({
  objectType,
  objectId,
  parentId,
}: UploadFieldProps) => {
  const { addUpload } = useUploadManager();
  const [file, setFile] = useState<Maybe<File>>(undefined);
  const intl = useIntl();

  const onDrop = (files: File[]) => {
    setFile(files[0]);
    addUpload(objectType, objectId, files[0], parentId);
  };

  return (
    <Dropzone onDrop={onDrop} disabled={!!file}>
      {({ getRootProps, getInputProps }) => (
        <DropzoneStyled {...getRootProps()}>
          <DropzonePlaceholder />
          <input
            {...getInputProps()}
            aria-label={intl.formatMessage(messages.ariaLabel)}
            aria-hidden="true"
          />
        </DropzoneStyled>
      )}
    </Dropzone>
  );
};
