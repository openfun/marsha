import { Box, Button } from 'grommet';
import { SwitchToDocumentSVG, SwitchToPlayerSVG } from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { usePictureInPicture } from 'hooks/usePictureInPicture';

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

const StyledButton = styled(Button)`
  padding: 0px;
  height: 100%;
  width: 100%;
  max-height: 80px;
  max-width: 80px;
  margin: auto;
`;

const ContainerStyle = styled(Box)`
  margin: auto;
  max-height: 35px;
  max-width: 35px;
`;

export const PictureInPictureSwitchAction = () => {
  const intl = useIntl();
  const [pipState, setPipState] = usePictureInPicture();

  return (
    <StyledButton
      a11yTitle={intl.formatMessage(
        pipState.reversed ? messages.documentActive : messages.playerActive,
      )}
      plain
      label={
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
