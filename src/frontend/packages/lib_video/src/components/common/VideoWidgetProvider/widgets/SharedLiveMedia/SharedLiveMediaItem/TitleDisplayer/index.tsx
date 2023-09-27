import { Anchor, Box } from 'grommet';
import { Maybe } from 'lib-common';
import { SharedLiveMedia, Text, uploadState } from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

const messages = defineMessages({
  noFilenameUploadFailed: {
    defaultMessage: 'Upload has failed',
    description:
      "A message displayed when upload has failed, and so the file hasn't any filename.",
    id: 'component.TitleDisplayer.noFilenameUploadFailed',
  },
});

const StyledAnchor = styled(Anchor)`
  cursor: ${({ isClickable }: { isClickable: boolean }) =>
    isClickable ? 'pointer' : 'auto'};
  font-family: Roboto-Medium;

  &:hover {
    text-decoration: ${({ isClickable }: { isClickable: boolean }) =>
      isClickable ? 'underline' : undefined};
  }
`;

interface TitleDisplayerProps {
  sharedLiveMedia: SharedLiveMedia;
  uploadingTitle: Maybe<string>;
}

export const TitleDisplayer = ({
  sharedLiveMedia,
  uploadingTitle,
}: TitleDisplayerProps) => {
  const intl = useIntl();
  const title =
    sharedLiveMedia.title ||
    uploadingTitle ||
    intl.formatMessage(messages.noFilenameUploadFailed);

  return (
    <StyledAnchor
      a11yTitle={title}
      download={sharedLiveMedia.filename}
      href={sharedLiveMedia.urls ? sharedLiveMedia.urls.media : undefined}
      // The click on the title triggers download of the associated upload. But this
      // behavior should be possible only if upload is complete and finished
      isClickable={sharedLiveMedia.upload_state === uploadState.READY}
      label={
        <Box style={{ minWidth: '0' }}>
          <Text truncate>{title}</Text>
        </Box>
      }
      rel="noopener"
      target="_blank"
      title={title}
    />
  );
};
