import { Box, Button, Layer, ResponsiveContext, Text } from 'grommet';
import { RoundCrossSVG } from 'lib-components';
import React from 'react';
import styled from 'styled-components';

import { normalizeColor } from 'grommet/utils';
import { theme } from 'utils/theme/theme';

const StyledTitleText = styled(Text)`
  font-family: 'Roboto-Medium';
`;

const StyledText = styled(Text)`
  line-height: 20px;
`;

interface InfoModalProps {
  text: string;
  title: string;
  onModalClose: () => void;
}

export const InfoModal = ({ text, title, onModalClose }: InfoModalProps) => {
  const size = React.useContext(ResponsiveContext);

  return (
    <Layer
      onEsc={onModalClose}
      onClickOutside={onModalClose}
      responsive={false}
      style={{
        width: size === 'small' ? '95%' : '500px',
        border: `1px solid ${normalizeColor('blue-active', theme)}`,
      }}
    >
      <Box background="bg-info" direction="column" round="6px">
        <Box
          direction="row-reverse"
          pad={{ horizontal: 'small', top: 'small' }}
        >
          <Button
            onClick={onModalClose}
            plain
            style={{ display: 'block', padding: 0 }}
          >
            <RoundCrossSVG height="20px" iconColor="blue-active" width="20px" />
          </Button>
        </Box>
        <Box
          direction="column"
          gap="medium"
          pad={{ horizontal: 'large', bottom: '30px' }}
        >
          <StyledTitleText color="blue-active" size="1.125rem" truncate>
            {title}
          </StyledTitleText>
          <StyledText color="blue-active" size="0.875rem">
            {text}
          </StyledText>
        </Box>
      </Box>
    </Layer>
  );
};
