import { Box } from 'grommet';
import React, { useEffect } from 'react';

import { XMPP } from '../../types/tracks';
import { converseMounter } from '../../utils/converse';

interface ChatProps {
  xmpp: XMPP;
}

const converseManager = converseMounter();

export const Chat = ({ xmpp }: ChatProps) => {
  useEffect(() => {
    converseManager('#converse-container', xmpp);
  }, []);

  return (
    <Box
      align="start"
      direction="row"
      height="large"
      pad={{ top: 'small' }}
      id="converse-container"
    />
  );
};
