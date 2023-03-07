import { useVideos, VideosOrderType } from 'lib-video';
import { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { REACT_QUERY_CONF_API } from 'conf/global';
import { ContentsWrapper, useContentPerPage } from 'features/Contents/';

import Video from './Video';

const messages = defineMessages({
  NoVideo: {
    defaultMessage: 'There is no video to display.',
    description: 'Text when there is no video to display.',
    id: 'features.Contents.features.ReadVideos.NoVideo',
  },
});

interface VideosProps {
  withPagination?: boolean;
  limit?: number;
}

const Videos = ({ withPagination = true, limit }: VideosProps) => {
  const intl = useIntl();
  const [currentPage, setCurrentPage] = useState(1);
  const contentPerPage = useContentPerPage();

  const apiResponse = useVideos(
    {
      offset: `${(currentPage - 1) * contentPerPage}`,
      limit: `${limit || contentPerPage}`,
      ordering: VideosOrderType.BY_CREATED_ON_REVERSED,
    },
    REACT_QUERY_CONF_API,
  );

  return (
    <ContentsWrapper
      apiResponse={apiResponse}
      dataComponent={(video, index) => (
        <Video key={`video-${video.id}-${index}`} video={video} />
      )}
      currentPage={currentPage}
      setCurrentPage={(page) => setCurrentPage(page)}
      noContentMessage={intl.formatMessage(messages.NoVideo)}
      withPagination={withPagination}
    />
  );
};

export default Videos;
