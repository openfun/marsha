import { Box, Image } from 'grommet';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { useSharedMediaCurrentPage } from '@lib-video/hooks/useSharedMediaCurrentPage';

const messages = defineMessages({
  altMessage: {
    defaultMessage: 'Shared document page {url}',
    description: 'Alt message for a shared document page',
    id: 'component.ImageViewer.altMessage',
  },
});

export const ImageViewer = () => {
  const intl = useIntl();
  const [currentPage] = useSharedMediaCurrentPage();

  return (
    <Box background="white">
      <Image
        alt={intl.formatMessage(messages.altMessage, {
          url: currentPage.imageUrl,
        })}
        src={currentPage.imageUrl}
        style={{ maxWidth: '100%' }}
      />
    </Box>
  );
};
