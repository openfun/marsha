import React, { useState } from 'react';
import Dropzone from 'react-dropzone';
import styled from 'styled-components';

import { modelName } from '../../types/models';
import { Maybe } from '../../utils/types';
import { useUploadManager } from '../UploadManager';
import { DropzonePlaceholder } from './DropzonePlaceholder';

const DropzoneStyled = styled.div`
  display: flex; /* For the dropzone contents */
  flex-grow: 1;
`;

export interface UploadFieldProps {
  objectType: modelName;
  objectId: string;
}

export const UploadField = ({ objectType, objectId }: UploadFieldProps) => {
  const { addUpload } = useUploadManager();
  const [file, setFile] = useState<Maybe<File>>(undefined);

  const onDrop = (files: any) => {
    setFile(files[0]);
    addUpload(objectType, objectId, files[0]);
  };

  return (
    <Dropzone onDrop={onDrop} disabled={!!file}>
      {({ getRootProps, getInputProps }) => (
        <DropzoneStyled {...getRootProps()}>
          <DropzonePlaceholder />
          <input {...getInputProps()} />
        </DropzoneStyled>
      )}
    </Dropzone>
  );
};
