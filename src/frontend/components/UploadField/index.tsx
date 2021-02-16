import React, { useState } from 'react';
import Dropzone from 'react-dropzone';
import styled from 'styled-components';

import { Maybe } from '../../utils/types';
import { DropzonePlaceholder } from './DropzonePlaceholder';

export interface UploadFieldProps {
  onContentUpdated: (fieldContent: Maybe<File>) => void;
}

const DropzoneStyled = styled.div`
  display: flex; /* For the dropzone contents */
  flex-grow: 1;
`;

export const UploadField = ({ onContentUpdated }: UploadFieldProps) => {
  const [file, setFile] = useState(undefined as Maybe<File>);

  const onDrop = (files: any) => {
    setFile(files[0]);
    onContentUpdated(files[0]);
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
