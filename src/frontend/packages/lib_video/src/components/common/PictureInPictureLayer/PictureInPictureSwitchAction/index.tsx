import { SwitchToDocumentSVG, SwitchToPlayerSVG } from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { usePictureInPicture } from '@lib-video/hooks/usePictureInPicture';

const messages = defineMessages({
  playerActive: {
    defaultMessage: 'Show document',
    description:
      'Title for picture in picture switch button when player is the main element',
    id: 'PictureInPictureLayer.PictureInPictureSwitchAction.playerActive',
  },
  documentActive: {
    defaultMessage: 'Show player',
    description:
      'Title for picture in picture switch button when document is the main element',
    id: 'PictureInPictureLayer.PictureInPictureSwitchAction.documentActive',
  },
});

export const PictureInPictureSwitchAction = () => {
  const intl = useIntl();
  const [pipState, setPipState] = usePictureInPicture();

  const style = {
    maxHeight: '35px',
    maxWidth: '35px',
    width: '100%',
    height: '100%',
  };

  if (pipState.reversed) {
    return (
      <SwitchToPlayerSVG
        iconColor="currentColor"
        aria-label={intl.formatMessage(messages.documentActive)}
        onClick={() => {
          setPipState({ reversed: !pipState.reversed });
        }}
        style={style}
      />
    );
  }

  return (
    <SwitchToDocumentSVG
      iconColor="currentColor"
      aria-label={intl.formatMessage(messages.playerActive)}
      onClick={() => {
        setPipState({ reversed: !pipState.reversed });
      }}
      style={style}
    />
  );
};
