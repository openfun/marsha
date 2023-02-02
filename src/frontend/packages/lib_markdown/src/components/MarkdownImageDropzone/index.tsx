import { Box } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { theme } from 'lib-common';
import { DropzoneIcon } from 'lib-components';
import React from 'react';
import Dropzone, { DropzoneOptions, DropzoneRootProps } from 'react-dropzone';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

const messages = defineMessages({
  uploadImageInDocument: {
    defaultMessage: 'Release to insert image in document',
    description:
      'Displayed help text when dragging an image over the Markdown editor',
    id: 'component.MarkdownImageDropzone.uploadImageInDocument',
  },
});

const DropzoneStyled = styled.div`
  border: ${(props: DropzoneRootProps) =>
    props.isDragAccept ? '3px dashed' : 'none'};
  border-radius: 0.375rem;
  border-color: ${normalizeColor('light-5', theme)};

  display: grid;
  grid-template-areas: 'overlay';
`;

const DropzoneOverlay = styled.div`
  background-color: ${normalizeColor('light-1', theme)};
  z-index: 100;

  grid-area: overlay;
`;

type MarkdownImageDropzoneProps = Pick<DropzoneOptions, 'onDropAccepted'>;

export const MarkdownImageDropzone = ({
  onDropAccepted,
  children,
}: React.PropsWithChildren<MarkdownImageDropzoneProps>) => {
  const intl = useIntl();

  return (
    <Dropzone
      onDropAccepted={onDropAccepted}
      noClick={true}
      accept={{
        // same as defined in backend
        'image/bmp': ['.bmp'],
        'image/gif': ['.gif'],
        'image/jpeg': ['.jpeg', '.jpg'],
        'image/png': ['.png'],
        'image/svg+xml': ['.svg'],
        'image/tiff': ['.tiff'],
        'image/webp': ['.webp'],
      }}
    >
      {({ getRootProps, getInputProps, isDragAccept }) => (
        <DropzoneStyled {...getRootProps({ isDragAccept })}>
          <input {...getInputProps()} />

          <Box
            fill
            style={{
              gridArea: 'overlay',
            }}
          >
            {children}
          </Box>
          {isDragAccept && (
            <DropzoneOverlay>
              <Box fill align="center" pad="large">
                <DropzoneIcon />
                <Box pad={{ top: 'large', bottom: 'none' }}>
                  {intl.formatMessage(messages.uploadImageInDocument)}
                </Box>
              </Box>
            </DropzoneOverlay>
          )}
        </DropzoneStyled>
      )}
    </Dropzone>
  );
};
