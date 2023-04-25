import { useVideos, VideosOrderType } from 'lib-video';
import { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { REACT_QUERY_CONF_API } from 'conf/global';
import {
  ContentFilter,
  ContentsWrapper,
  useContentPerPage,
} from 'features/Contents/';
import { routes } from 'routes';

import Video from './Video';

const messages = defineMessages({
  MyVideos: {
    defaultMessage: 'My Videos',
    description: 'My contents page, my videos title',
    id: 'features.Contents.features.VideoContents.MyVideos',
  },
  NoVideo: {
    defaultMessage: 'There is no video to display.',
    description: 'Text when there is no video to display.',
    id: 'features.Contents.features.ReadVideos.NoVideo',
  },
});

export const videoContents = (playlistId?: string) => ({
  title: messages.MyVideos,
  route: routes.CONTENTS.subRoutes.VIDEO.path,
  component: (
    <Videos
      withPagination={false}
      limit={4}
      playlistId={playlistId}
      withFilter={false}
    />
  ),
});

interface VideosProps {
  withPagination?: boolean;
  withFilter?: boolean;
  limit?: number;
  playlistId?: string;
}

const Videos = ({
  withPagination = true,
  withFilter = true,
  playlistId = '',
  limit,
}: VideosProps) => {
  const intl = useIntl();
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<ContentFilter>({
    playlist: playlistId,
  });
  const contentPerPage = useContentPerPage();

  const apiResponse = useVideos(
    {
      offset: `${(currentPage - 1) * contentPerPage}`,
      limit: `${limit || contentPerPage}`,
      ordering: VideosOrderType.BY_CREATED_ON_REVERSED,
      is_live: 'false',
      playlist: filter.playlist,
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
      filter={filter}
      setCurrentPage={(page) => setCurrentPage(page)}
      setFilter={(newFilter) => setFilter(newFilter)}
      noContentMessage={intl.formatMessage(messages.NoVideo)}
      withPagination={withPagination}
      withFilter={withFilter}
    />
  );
};

export default Videos;
