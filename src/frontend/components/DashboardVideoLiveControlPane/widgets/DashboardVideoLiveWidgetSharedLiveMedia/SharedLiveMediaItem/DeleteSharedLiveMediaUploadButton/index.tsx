import { Button } from 'grommet';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { BinSVG } from 'components/SVGIcons/BinSVG';
import { useDeleteSharedLiveMediaUploadModal } from 'data/stores/useDeleteSharedLiveMediaUploadModal';
import { SharedLiveMedia } from 'types/tracks';

const messages = defineMessages({
  buttonLabel: {
    defaultMessage: 'Click on this button to delete the media.',
    description: 'The label of the button to delete a media.',
    id: 'components.DeleteSharedLiveMediaUploadButton.buttonLabel',
  },
});

interface DeleteSharedLiveMediaUploadButtonProps {
  sharedLiveMedia: SharedLiveMedia;
}

export const DeleteSharedLiveMediaUploadButton = ({
  sharedLiveMedia,
}: DeleteSharedLiveMediaUploadButtonProps) => {
  const [_, setDeleteSharedLiveMediaUploadModal] =
    useDeleteSharedLiveMediaUploadModal();
  const intl = useIntl();

  return (
    <Button
      a11yTitle={intl.formatMessage(messages.buttonLabel)}
      onClick={() => setDeleteSharedLiveMediaUploadModal(sharedLiveMedia)}
      plain
      style={{ display: 'block', padding: 0 }}
    >
      <BinSVG height="18px" iconColor="blue-active" width="14px" />
    </Button>
  );
};
