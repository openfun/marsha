import * as React from 'react';
import Dropzone from 'react-dropzone';
import styled from 'styled-components';

import { Maybe } from '../../utils/types';
import { DropzonePlaceholder } from './DropzonePlaceholder';

export interface VideoUploadFieldProps {
  onContentUpdated: (fieldContent: Maybe<File>) => void;
}

interface VideoUploadFieldState {
  file: Maybe<File>;
}

const DropzoneStyled = styled(Dropzone)`
  display: flex; /* For the dropzone contents */
  flex-grow: 1;
`;

export class VideoUploadField extends React.Component<
  VideoUploadFieldProps,
  VideoUploadFieldState
> {
  onDrop(files: any) {
    this.setState({ file: files[0] });
    this.props.onContentUpdated(files[0]);
  }

  render() {
    return (
      <DropzoneStyled
        onDrop={this.onDrop.bind(this)}
        disabled={!!(this.state && this.state.file)}
      >
        <DropzonePlaceholder />
      </DropzoneStyled>
    );
  }
}
