import { Layer } from 'grommet';
import { colorsTokens, isFirefox, isIframe } from 'lib-common';
import React, { useCallback, useEffect } from 'react';

import { Box, Heading, RoundCrossSVG, Text } from '@lib-components/common';
import { useResponsive } from '@lib-components/hooks/useResponsive';

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
  const { isMobile } = useResponsive();
  const positionAbove = 200; // px

  useEffect(() => {
    if (!isFirefox() && refWidget) {
      const timeout = setTimeout(() => {
        refWidget.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 50);

      return () => clearTimeout(timeout);
    }

    return () => null;
  }, [refWidget]);

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
        width: isMobile ? '95%' : '500px',
        background: 'transparent',
        marginTop: `${
          refWidget?.offsetTop
            ? isFirefox() || !isIframe()
              ? positionAbove
              : refWidget?.offsetTop - positionAbove
            : 0
        }px`,
      }}
      position={refWidget?.offsetTop ? 'top' : 'center'}
      data-testid="info-modal"
    >
      <Box
        background={colorsTokens['info-100']}
        round="xsmall"
        style={{
          border: `1px solid ${colorsTokens['info-500']}`,
        }}
      >
        <Box
          direction="row-reverse"
          pad={{ horizontal: 'small', top: 'small' }}
        >
          <RoundCrossSVG
            onClick={onClose}
            height="20px"
            iconColor={colorsTokens['info-500']}
            width="20px"
          />
        </Box>
        <Box gap="medium" pad={{ horizontal: 'large', bottom: '30px' }}>
          <Heading level={2} truncate className="m-0">
            {title}
          </Heading>
          <Text style={{ whiteSpace: 'pre-line' }}>{text}</Text>
        </Box>
      </Box>
    </Layer>
  );
};
