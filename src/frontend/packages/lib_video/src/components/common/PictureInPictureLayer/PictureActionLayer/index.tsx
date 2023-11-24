import { colorsTokens } from '@lib-common/cunningham';
import { Box, DropButton, MoreOptionSVG } from 'lib-components';
import { ReactNode, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { startDraggingHandler } from '../usePIPDragger';

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
    <Box
      key="actions-layer"
      fill
      onMouseDown={startDragging}
      onMouseOver={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      style={{
        transition: 'opacity 0.3s ease-in-out',
        opacity: isHover ? 1 : 0,
        cursor: 'move',
      }}
      background={actions && actions.length > 0 ? '#0000008C' : 'transparent'}
    >
      <Box
        key="large-picture-action-container"
        justify="space-between"
        direction="row"
        fill
        pad="small"
        display={pictureWidth >= minActionWidth ? 'flex' : 'none'}
      >
        {actions?.map((action, index) => (
          <Box key={`pip_action_${index}`} margin="auto" color="white">
            {action}
          </Box>
        ))}
      </Box>

      <Box
        key="small-picture-action-container"
        fill
        pad="small"
        align="center"
        justify="center"
        display={pictureWidth < minActionWidth ? 'flex' : 'none'}
      >
        <DropButton
          button={
            <MoreOptionSVG
              key="more-options"
              iconColor="white"
              width={40}
              aria-label={intl.formatMessage(messages.moreOptionTitle)}
              style={{ padding: '1rem' }}
            />
          }
        >
          {actions?.map((action, index) => (
            <Box
              key={`pip_action_${index}`}
              margin="small"
              color={colorsTokens['primary-500']}
            >
              {action}
            </Box>
          ))}
        </DropButton>
      </Box>
    </Box>
  );
};
