import { Button } from '@openfun/cunningham-react';
import { colorsTokens } from 'lib-common';
import { BinSVG, SharedLiveMedia } from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { useDeleteSharedLiveMediaModal } from '@lib-video/hooks/useDeleteSharedLiveMediaModal';

const messages = defineMessages({
  buttonLabel: {
    defaultMessage: 'Click on this button to delete the media.',
    description: 'The label of the button to delete a media.',
    id: 'components.DeleteSharedLiveMediaButton.buttonLabel',
  },
});

interface DeleteSharedLiveMediaButtonProps {
  sharedLiveMedia: SharedLiveMedia;
}

export const DeleteSharedLiveMediaButton = ({
  sharedLiveMedia,
}: DeleteSharedLiveMediaButtonProps) => {
  const [_, setDeleteSharedLiveMediaModal] = useDeleteSharedLiveMediaModal();
  const intl = useIntl();

  return (
    <Button
      aria-label={intl.formatMessage(messages.buttonLabel)}
      onClick={() => setDeleteSharedLiveMediaModal(sharedLiveMedia)}
      color="tertiary"
      icon={
        <BinSVG
          height="18px"
          iconColor={colorsTokens['danger-200']}
          width="14px"
        />
      }
    />
  );
};
