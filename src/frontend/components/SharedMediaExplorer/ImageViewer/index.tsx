import React from 'react';

import { useSharedMediaCurrentPage } from 'data/stores/useSharedMediaCurrentPage';
import { Box } from 'grommet';

export const ImageViewer = () => {
  const [currentPage] = useSharedMediaCurrentPage();

  return (
    <Box background="white">
      <img src={currentPage.imageUrl} style={{ maxWidth: '100%' }} />
    </Box>
  );
};
