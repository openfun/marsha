import { Box } from 'grommet';
import {
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
        <Box border={{ color: 'blue-active' }} pad="small" round="xsmall">
          <Text textAlign="center">{messageToDisplay}</Text>
        </Box>
      ) : (
        <ThumbnailDisplayer rounded urlsThumbnail={thumbnail.urls} />
      )}
    </React.Fragment>
  );
};
