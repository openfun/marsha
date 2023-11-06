import { Box, BoxProps } from 'lib-components';
import React from 'react';

import { ChatLayout } from './ChatLayout';

interface ChatProps {
  isModerated: boolean;
  standalone?: boolean;
}

export const Chat = ({ isModerated, standalone }: ChatProps) => {
  const conditionalProps: Partial<BoxProps<'div'>> = {};
  if (standalone) {
    conditionalProps.height = 'large';
  } else {
    conditionalProps.fill = true;
  }

  return (
    <Box {...conditionalProps}>
      {!!standalone ? (
        <div>
          <ChatLayout isModerated={isModerated} />
        </div>
      ) : (
        <ChatLayout isModerated={isModerated} />
      )}
    </Box>
  );
};
