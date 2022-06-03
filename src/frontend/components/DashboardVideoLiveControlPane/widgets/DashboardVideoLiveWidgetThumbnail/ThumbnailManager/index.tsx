import { Box, Text } from 'grommet';
import React from 'react';
import { useIntl } from 'react-intl';

import { ThumbnailDisplayer } from 'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetThumbnail/ThumbnailDisplayer';
import { UploadManagerState } from 'components/UploadManager';
import { Thumbnail } from 'types/tracks';
import { determineMessage } from 'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetThumbnail/utils/utils';

interface ThumbnailManagerProps {
  thumbnail: Thumbnail;
  uploadManagerState: UploadManagerState;
}

export const ThumbnailManager = ({
  thumbnail,
  uploadManagerState,
}: ThumbnailManagerProps) => {
  const intl = useIntl();

  const messageToDisplay = determineMessage(thumbnail, uploadManagerState);

  return (
    <React.Fragment>
      {messageToDisplay ? (
        <Box border={{ color: 'blue-active' }} pad="small" round="xsmall">
          <Text alignSelf="center" color="blue-active" size="0.875rem">
            {intl.formatMessage(messageToDisplay)}
          </Text>
        </Box>
      ) : (
        <ThumbnailDisplayer rounded urlsThumbnail={thumbnail.urls} />
      )}
    </React.Fragment>
  );
};
