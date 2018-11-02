import * as React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { colors } from '../../utils/theme/theme';
import { Button } from '../Button/Button';
import { DropzoneIcon } from './DropzoneIcon';

const messages = defineMessages({
  dropzoneButtonPick: {
    defaultMessage: 'Select a video to upload',
    description: `Video upload file dropzone: button to choose a video to upload,
      has the drag text next to it (components.VideoForm.dropzoneDragText)`,
    id: 'components.VideoForm.dropzoneButtonPick',
  },
  dropzoneDragText: {
    defaultMessage: 'or drop it here',
    description: `Video upload file dropzone: helptext on the dropzone,
      goes along with the button (components.VideoForm.dropzoneButtonPick)`,
    id: 'components.VideoForm.dropzoneDragText',
  },
});

const DropzonePlaceholderStyled = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  flex-grow: 1;
  align-items: center;
  background-color: ${colors.lightGray.main};
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
const DropzoneTextBox = styled.div`
  z-index: 1;
`;

const DropzoneDashBox = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  bottom: 0.5rem;
  left: 0.5rem;
  border: 3px dashed ${colors.mediumGray.main};
  border-radius: 0.375rem;
`;

export const DropzonePlaceholder = () => (
  <DropzonePlaceholderStyled>
    <DropzoneDashBox />
    <DropzoneIcon />
    <DropzoneTextBox>
      <Button variant="primary">
        <FormattedMessage {...messages.dropzoneButtonPick} />
      </Button>
      <DropzoneHelpText>
        <FormattedMessage {...messages.dropzoneDragText} />
      </DropzoneHelpText>
    </DropzoneTextBox>
  </DropzonePlaceholderStyled>
);
