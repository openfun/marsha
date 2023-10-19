import { Button } from '@openfun/cunningham-react';
import { Box } from 'grommet';
import React, { ReactNode } from 'react';

interface LiveModaleAction {
  title?: string;
  label: string;
  action: () => void;
}

export interface LiveModaleProps {
  content: ReactNode;
  actions: LiveModaleAction[];
}

export const LiveModale = ({ content, actions }: LiveModaleProps) => {
  return (
    <Box fill>
      <Box
        background="dark-background"
        margin="auto"
        pad={{ horizontal: 'large', vertical: 'medium' }}
        round="small"
        width={{ min: '45vw', max: '600px', width: '50%' }}
        height={{ min: 'auto' }}
        style={{ zIndex: 33 }}
      >
        {content}
        {actions.map((action, index) => (
          <Button
            key={`live-modale-button-${index}`}
            title={action.title ?? action.label}
            aria-label={action.title ?? action.label}
            onClick={action.action}
            fullWidth
            className="mt-s mb-s"
          >
            {action.label}
          </Button>
        ))}
      </Box>
    </Box>
  );
};
