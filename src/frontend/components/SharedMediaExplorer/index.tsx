import { Box, Stack } from 'grommet';
import React, { PropsWithChildren } from 'react';

import { SharedMediaCurrentPageProvider } from 'data/stores/useSharedMediaCurrentPage';
import { SharedLiveMediaUrls } from 'types/tracks';

import { ImageViewer } from './ImageViewer';
import { useLivePanelState } from 'data/stores/useLivePanelState';
import { usePictureInPicture } from 'data/stores/usePictureInPicture';

interface SharedMediaExplorerProps {
  initialPage: number;
  pages: SharedLiveMediaUrls['pages'];
}

export const SharedMediaExplorer = ({
  children,
  initialPage,
  pages,
}: PropsWithChildren<SharedMediaExplorerProps>) => {
  const isPanelOpen = useLivePanelState((state) => state.isPanelVisible);
  const [pipState] = usePictureInPicture();

  return (
    <Box
      flex
      border={
        isPanelOpen && pipState.reversed
          ? { size: 'small', color: 'blue-active', side: 'right' }
          : undefined
      }
    >
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
