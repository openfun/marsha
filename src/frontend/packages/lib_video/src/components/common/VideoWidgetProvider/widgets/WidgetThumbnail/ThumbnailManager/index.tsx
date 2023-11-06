import { colorsTokens } from 'lib-common';
import {
  Box,
  Text,
  Thumbnail,
  ThumbnailDisplayer,
  UploadManagerState,
} from 'lib-components';
import React from 'react';

import { useDetermineMessage } from './utils/utils';

interface ThumbnailManagerProps {
  thumbnail: Thumbnail;
  uploadManagerState: UploadManagerState;
}

export const ThumbnailManager = ({
  thumbnail,
  uploadManagerState,
}: ThumbnailManagerProps) => {
  const messageToDisplay = useDetermineMessage(thumbnail, uploadManagerState);

  return (
    <React.Fragment>
      {messageToDisplay ? (
        <Box
          style={{ border: `1px solid ${colorsTokens['info-500']}` }}
          pad="small"
          round="xsmall"
        >
          <Text textAlign="center">{messageToDisplay}</Text>
        </Box>
      ) : (
        <ThumbnailDisplayer rounded urlsThumbnail={thumbnail.urls} />
      )}
    </React.Fragment>
  );
};
