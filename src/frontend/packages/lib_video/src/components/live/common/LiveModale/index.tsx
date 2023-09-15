import { Box, Button } from 'grommet';
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
            a11yTitle={action.title ?? action.label}
            label={action.label}
            margin={{ vertical: 'small' }}
            onClick={action.action}
            primary
          />
        ))}
      </Box>
    </Box>
  );
};
