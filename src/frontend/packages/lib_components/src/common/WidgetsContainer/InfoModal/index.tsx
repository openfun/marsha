import { Box, Button, Layer, ResponsiveContext, Text } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { theme } from 'lib-common';
import React, { useCallback, useEffect } from 'react';
import styled from 'styled-components';

import { RoundCrossSVG } from 'common/SVGIcons/RoundCrossSVG';

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
  refWidget?: HTMLDivElement | null;
}

export const InfoModal = ({
  text,
  title,
  onModalClose,
  refWidget,
}: InfoModalProps) => {
  const size = React.useContext(ResponsiveContext);
  const positionAbove = 200; // px
  const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

  useEffect(() => {
    if (!isFirefox && refWidget) {
      const timeout = setTimeout(() => {
        refWidget.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 50);

      return () => clearTimeout(timeout);
    }

    return () => null;
  }, [refWidget, isFirefox]);

  const onClose = useCallback(() => {
    onModalClose();

    if (refWidget) {
      setTimeout(() => {
        refWidget.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 200);
    }
  }, [onModalClose, refWidget]);

  return (
    <Layer
      onEsc={onClose}
      onClickOutside={onClose}
      responsive={false}
      style={{
        width: size === 'small' ? '95%' : '500px',
        border: `1px solid ${normalizeColor('blue-active', theme)}`,
        marginTop: `${
          refWidget?.offsetTop
            ? isFirefox
              ? positionAbove
              : refWidget?.offsetTop - positionAbove
            : 0
        }px`,
      }}
      position={refWidget?.offsetTop ? 'top' : 'center'}
      data-testid="info-modal"
    >
      <Box background="bg-info" direction="column" round="6px">
        <Box
          direction="row-reverse"
          pad={{ horizontal: 'small', top: 'small' }}
        >
          <Button
            onClick={onClose}
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
