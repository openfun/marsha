import { Button } from '@openfun/cunningham-react';
import { Box } from 'grommet';
import { SwitchToDocumentSVG, SwitchToPlayerSVG } from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

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

const ContainerStyle = styled(Box)`
  margin: auto;
  max-height: 35px;
  max-width: 35px;
`;

export const PictureInPictureSwitchAction = () => {
  const intl = useIntl();
  const [pipState, setPipState] = usePictureInPicture();

  return (
    <Button
      className="c__button-no-bg"
      aria-label={intl.formatMessage(
        pipState.reversed ? messages.documentActive : messages.playerActive,
      )}
      color="tertiary"
      icon={
        <ContainerStyle>
          {pipState.reversed ? (
            <SwitchToPlayerSVG iconColor="white" height="100%" width="100%" />
          ) : (
            <SwitchToDocumentSVG iconColor="white" height="100%" width="100%" />
          )}
        </ContainerStyle>
      }
      onClick={() => {
        setPipState({ reversed: !pipState.reversed });
      }}
    />
  );
};
