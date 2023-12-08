import { Button } from '@openfun/cunningham-react';
import { Maybe, colorsTokens } from 'lib-common';
import { SharedLiveMedia, Text, uploadState } from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  noFilenameUploadFailed: {
    defaultMessage: 'Upload has failed',
    description:
      "A message displayed when upload has failed, and so the file hasn't any filename.",
    id: 'component.TitleDisplayer.noFilenameUploadFailed',
  },
});

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

  const isDisabled = sharedLiveMedia.upload_state !== uploadState.READY;

  if (isDisabled) {
    return (
      <Text truncate weight="medium" color={colorsTokens['greyscale-500']}>
        {title}
      </Text>
    );
  }

  return (
    <Button
      aria-label={title}
      download={sharedLiveMedia.filename}
      href={sharedLiveMedia.urls?.media || undefined}
      title={title}
      color="tertiary"
      size="nano"
    >
      <Text truncate weight="bold" color={colorsTokens['primary-500']}>
        {title}
      </Text>
    </Button>
  );
};
