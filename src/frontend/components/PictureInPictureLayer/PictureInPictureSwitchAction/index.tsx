import { Box, Button } from 'grommet';
import React from 'react';
import styled from 'styled-components';

import { SwitchToDocumentSVG } from 'components/SVGIcons/SwitchToDocumentSVG';
import { SwitchToPlayerSVG } from 'components/SVGIcons/SwitchToPlayerSVG';
import { usePictureInPicture } from 'data/stores/usePictureInPicture';

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
  const [pipState, setPipState] = usePictureInPicture();

  return (
    <StyledButton
      data-testid="pip-switch-action"
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
