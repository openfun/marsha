import { Box, Button, Heading, Layer } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { isFirefox, isIframe, theme } from 'lib-common';
import React, { useCallback, useEffect } from 'react';

import { RoundCrossSVG } from '@lib-components/common/SVGIcons/RoundCrossSVG';
import { Text } from '@lib-components/common/Text';
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
        border: `1px solid ${normalizeColor('blue-active', theme)}`,
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
          <Heading level={3} truncate className="m-0">
            {title}
          </Heading>
          <Text style={{ whiteSpace: 'pre-line' }}>{text}</Text>
        </Box>
      </Box>
    </Layer>
  );
};
