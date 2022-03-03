import { Box, BoxExtendedProps } from 'grommet';
import React from 'react';

import { ChatLayout } from './ChatLayout';

interface ChatProps {
  standalone?: boolean;
}

export const Chat = ({ standalone }: ChatProps) => {
  const conditionalProps: Partial<BoxExtendedProps> = {};
  if (standalone) {
    conditionalProps.height = 'large';
  } else {
    conditionalProps.fill = true;
  }

  return (
    <Box {...conditionalProps}>
      {!!standalone ? (
        <div>
          <ChatLayout />
        </div>
      ) : (
        <ChatLayout />
      )}
    </Box>
  );
};
