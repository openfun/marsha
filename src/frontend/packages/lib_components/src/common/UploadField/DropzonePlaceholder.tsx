import { Button } from '@openfun/cunningham-react';
import { Box } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { theme } from 'lib-common';
import * as React from 'react';
import { FormattedMessage, defineMessages } from 'react-intl';
import styled from 'styled-components';

import { DropzoneIcon } from './DropzoneIcon';

const messages = defineMessages({
  dropzoneButtonPick: {
    defaultMessage: 'Select a file to upload',
    description: `File upload dropzone: button to choose a file to upload,
      has the drag text next to it (components.UploadForm.dropzoneDragText)`,
    id: 'components.UploadForm.dropzoneButtonPick',
  },
  dropzoneDragText: {
    defaultMessage: 'or drop it here',
    description: `File upload dropzone: helptext on the dropzone,
      goes along with the button (components.UploadForm.dropzoneButtonPick)`,
    id: 'components.UploadForm.dropzoneDragText',
  },
});

const DropzonePlaceholderStyled = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  flex-grow: 1;
  align-items: center;
  background-color: ${normalizeColor('light-1', theme)};
  padding-top: 2rem;
  padding-bottom: 1rem;
`;

// Align the helptext vertically exactly with the button
const DropzoneHelpText = styled.span`
  padding: 0.375rem 0.75rem 0.375rem 0.375rem;
  display: inline-block;
  border: 1px solid transparent;
  vertical-align: middle;
`;

// Make sure the dashbox background does not overlay the interactive UI
const DropzoneTextBox = styled(Box)`
  z-index: 1;
`;

const DropzoneDashBox = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  bottom: 0.5rem;
  left: 0.5rem;
  border: 3px dashed ${normalizeColor('light-5', theme)};
  border-radius: 0.375rem;
`;

export const DropzonePlaceholder = () => (
  <DropzonePlaceholderStyled>
    <DropzoneDashBox />
    <DropzoneIcon />
    <DropzoneTextBox direction="row">
      <Button>
        <FormattedMessage {...messages.dropzoneButtonPick} />
      </Button>
      <DropzoneHelpText>
        <FormattedMessage {...messages.dropzoneDragText} />
      </DropzoneHelpText>
    </DropzoneTextBox>
  </DropzonePlaceholderStyled>
);
