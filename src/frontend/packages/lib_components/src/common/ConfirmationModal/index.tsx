import { Box, Button, Layer, Text } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { theme } from 'lib-common';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { RoundCrossSVG } from '@lib-components/common/SVGIcons/RoundCrossSVG';
import { useResponsive } from '@lib-components/hooks/useResponsive';

const messages = defineMessages({
  confirmButtonLabel: {
    defaultMessage: 'Confirm',
    description: 'Label of the confirming button',
    id: 'components.ConfirmationModal.confirmButtonLabel',
  },
  cancelButtonLabel: {
    defaultMessage: 'Cancel',
    description: 'Label of the cancelling button',
    id: 'components.ConfirmationModal.cancelButtonLabel',
  },
});

const StyledTitleText = styled(Text)`
  font-family: 'Roboto-Medium';
`;

const StyledText = styled(Text)`
  line-height: 20px;
`;

interface ConfirmationModalProps {
  text: string;
  title: string;
  onModalCloseOrCancel: () => void;
  onModalConfirm: () => void;
  color?: string;
}

export const ConfirmationModal = ({
  text,
  title,
  onModalCloseOrCancel,
  onModalConfirm,
  color,
}: ConfirmationModalProps) => {
  const intl = useIntl();
  const { isMobile } = useResponsive();

  return (
    <Layer
      onEsc={onModalCloseOrCancel}
      onClickOutside={onModalCloseOrCancel}
      responsive={false}
      style={{
        width: isMobile ? '95%' : '500px',
        border: `1px solid ${normalizeColor('blue-active', theme)}`,
      }}
    >
      <Box background="bg-info" direction="column" round="6px">
        <Box
          direction="row-reverse"
          pad={{ horizontal: 'small', top: 'small' }}
        >
          <Button
            onClick={onModalCloseOrCancel}
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
          <StyledTitleText color="blue-active" size="1.5rem" truncate>
            {title}
          </StyledTitleText>
          <StyledText color="blue-active" size="1rem">
            {text}
          </StyledText>
          <Box direction="row" gap="medium">
            <Button
              primary
              label={intl.formatMessage(messages.confirmButtonLabel)}
              onClick={onModalConfirm}
              color={color || 'blue-active'}
            />
            <Button
              secondary
              label={intl.formatMessage(messages.cancelButtonLabel)}
              onClick={onModalCloseOrCancel}
              style={{
                color: normalizeColor('blue-active', theme),
              }}
            />
          </Box>
        </Box>
      </Box>
    </Layer>
  );
};
