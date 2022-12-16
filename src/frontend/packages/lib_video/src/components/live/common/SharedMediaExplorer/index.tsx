import { Box, Stack } from 'grommet';
import { SharedLiveMediaUrls } from 'lib-components';
import React, { PropsWithChildren } from 'react';

import { useLivePanelState } from 'hooks/useLivePanelState';
import { usePictureInPicture } from 'hooks/usePictureInPicture';
import { SharedMediaCurrentPageProvider } from 'hooks/useSharedMediaCurrentPage';

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
