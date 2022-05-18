import { Button } from 'grommet';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { BinSVG } from 'components/SVGIcons/BinSVG';
import { useDeleteUploadModal } from 'data/stores/useDeleteUploadModal';
import { SharedLiveMedia } from 'types/tracks';

const messages = defineMessages({
  buttonLabel: {
    defaultMessage: 'Click on this button to delete the media.',
    description: 'The label of the button to delete a media.',
    id: 'components.DeleteUploadButton.buttonLabel',
  },
});

interface DeleteUploadButtonProps {
  sharedLiveMedia: SharedLiveMedia;
}

export const DeleteUploadButton = ({
  sharedLiveMedia,
}: DeleteUploadButtonProps) => {
  const [_, setDeleteUploadModal] = useDeleteUploadModal();
  const intl = useIntl();

  return (
    <Button
      a11yTitle={intl.formatMessage(messages.buttonLabel)}
      onClick={() => setDeleteUploadModal(sharedLiveMedia)}
      plain
      style={{ display: 'block', padding: 0 }}
    >
      <BinSVG height="18px" iconColor="blue-active" width="14px" />
    </Button>
  );
};
