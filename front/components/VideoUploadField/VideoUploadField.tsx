import * as React from 'react';
import Dropzone from 'react-dropzone';
import { defineMessages, FormattedMessage } from 'react-intl';

import { Maybe } from '../../utils/types';

export interface VideoUploadFieldProps {
  onContentUpdated: (fieldContent: Maybe<File>) => void;
}

interface VideoUploadFieldState {
  file: Maybe<File>;
}

const messages = defineMessages({
  dropzoneButtonPick: {
    defaultMessage: 'Pick a video to upload',
    description:
      'Video upload file dropzone: button to choose a video to upload',
    id: 'components.VideoForm.dropzoneButtonPick',
  },
  dropzoneClear: {
    defaultMessage: 'Clear selected file',
    description:
      'Video upload file dropzone: link to remove the currently selected video',
    id: 'components.VideoForm.dropzoneClear',
  },
});

export class VideoUploadField extends React.Component<
  VideoUploadFieldProps,
  VideoUploadFieldState
> {
  clearFile() {
    this.setState({ file: undefined });
    this.props.onContentUpdated(undefined);
  }

  onDrop(files: any) {
    this.setState({ file: files[0] });
    this.props.onContentUpdated(files[0]);
  }

  render() {
    return (
      <div className="dropzone">
        <Dropzone
          onDrop={this.onDrop.bind(this)}
          disabled={!!(this.state && this.state.file)}
        >
          {// Show either the 'upload' button or the 'clear' link
          this.state && !!this.state.file ? (
            <a onClick={this.clearFile.bind(this)}>
              <FormattedMessage {...messages.dropzoneClear} />
            </a>
          ) : (
            <button>
              <FormattedMessage {...messages.dropzoneButtonPick} />
            </button>
          )}
        </Dropzone>
      </div>
    );
  }
}
