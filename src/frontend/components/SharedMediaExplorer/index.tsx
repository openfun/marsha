import { Box, Stack } from 'grommet';
import React, { PropsWithChildren } from 'react';

import { SharedMediaCurrentPageProvider } from 'data/stores/useSharedMediaCurrentPage';
import { SharedLiveMediaUrls } from 'types/tracks';

import { ImageViewer } from './ImageViewer';

interface SharedMediaExplorerProps {
  initialPage: number;
  pages: SharedLiveMediaUrls['pages'];
}

export const SharedMediaExplorer = ({
  children,
  initialPage,
  pages,
}: PropsWithChildren<SharedMediaExplorerProps>) => {
  return (
    <Box flex>
      <SharedMediaCurrentPageProvider
        value={{
          page: initialPage,
          imageUrl: pages[initialPage],
        }}
      >
        <Stack interactiveChild="last">
          <ImageViewer />
          {children}
        </Stack>
      </SharedMediaCurrentPageProvider>
    </Box>
  );
};
