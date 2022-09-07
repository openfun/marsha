import { Box, DropButton } from 'grommet';
import { MoreOptionSVG } from 'lib-components';
import React, { CSSProperties, ReactNode, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { startDraggingHandler } from 'components/PictureInPictureLayer/usePIPDragger';

const DragLayer = styled(Box)`
  cursor: move;
`;

const ActionContainer = styled(Box)`
  display: ${({ display }: { display: CSSProperties['display'] }) =>
    display ?? 'flex'};
`;

const messages = defineMessages({
  moreOptionTitle: {
    defaultMessage: 'More options',
    description:
      'More options button title used when the picture is too small to display all actions.',
    id: 'components.PictureInPictureLayer.PictureActionLayer.moveOptionTitle',
  },
});

interface PictureActionLayerProps {
  actions?: ReactNode[];
  pictureWidth: number;
  startDragging?: startDraggingHandler;
}

export const PictureActionLayer = ({
  actions,
  pictureWidth,
  startDragging,
}: PictureActionLayerProps) => {
  const intl = useIntl();
  const [isHover, setIsHover] = useState(false);

  const minActionWidth = (actions?.length ?? 0) * 50;

  return (
    <DragLayer
      key="actions-layer"
      fill
      onMouseDown={startDragging}
      onMouseOver={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      animation={
        isHover
          ? { type: 'fadeIn', duration: 350 }
          : { type: 'fadeOut', duration: 350, delay: 1800 }
      }
      background={actions && actions.length > 0 ? '#0000008C' : 'transparent'}
    >
      <ActionContainer
        key="large-picture-action-container"
        justify="between"
        direction="row"
        fill
        pad="small"
        display={pictureWidth >= minActionWidth ? 'flex' : 'none'}
      >
        {actions?.map((action, index) => (
          <Box key={`pip_action_${index}`} margin="auto">
            {action}
          </Box>
        ))}
      </ActionContainer>

      <ActionContainer
        key="small-picture-action-container"
        fill
        pad="small"
        display={pictureWidth < minActionWidth ? 'flex' : 'none'}
      >
        <DropButton
          a11yTitle={intl.formatMessage(messages.moreOptionTitle)}
          dropAlign={{ top: 'bottom' }}
          dropContent={
            <Box>
              {actions?.map((action, index) => (
                <Box key={`pip_action_${index}`} margin="small">
                  {action}
                </Box>
              ))}
            </Box>
          }
          dropProps={{}}
          margin="auto"
          style={{ padding: 0, maxWidth: '40px', width: '100%' }}
        >
          <Box pad={{ vertical: 'small' }}>
            <MoreOptionSVG key="more-options" iconColor="white" />
          </Box>
        </DropButton>
      </ActionContainer>
    </DragLayer>
  );
};
