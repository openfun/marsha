import { useVideos, VideosOrderType } from 'lib-video';
import { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { REACT_QUERY_CONF_API } from 'conf/global';
import {
  ContentFilter,
  ContentsWrapper,
  useContentPerPage,
} from 'features/Contents/';

import routes from '../../routes';

import Live from './Live';

const messages = defineMessages({
  MyWebinars: {
    defaultMessage: 'My Webinars',
    description: 'My contents page, my webinars title',
    id: 'features.Contents.features.LiveContents.MyWebinars',
  },
  NoLive: {
    defaultMessage: 'There is no webinar to display.',
    description: 'Text when there is no webinar to display.',
    id: 'features.Contents.features.ReadLives.NoLive',
  },
});

export const liveContents = (playlistId?: string) => ({
  title: messages.MyWebinars,
  route: routes.LIVE.path,
  component: (
    <Lives
      withPagination={false}
      limit={4}
      playlistId={playlistId}
      withFilter={false}
    />
  ),
});

interface LivesProps {
  withPagination?: boolean;
  withFilter?: boolean;
  limit?: number;
  playlistId?: string;
}

const Lives = ({
  withPagination = true,
  withFilter = true,
  playlistId = '',
  limit,
}: LivesProps) => {
  const intl = useIntl();
  const [currentPage, setCurrentPage] = useState(1);
  const contentPerPage = useContentPerPage();
  const [filter, setFilter] = useState<ContentFilter>({
    playlist: playlistId,
  });

  const apiResponse = useVideos(
    {
      offset: `${(currentPage - 1) * contentPerPage}`,
      limit: `${limit || contentPerPage}`,
      ordering: VideosOrderType.BY_CREATED_ON_REVERSED,
      is_live: 'true',
      playlist: filter.playlist,
    },
    REACT_QUERY_CONF_API,
  );

  return (
    <ContentsWrapper
      apiResponse={apiResponse}
      dataComponent={(live, index) => (
        <Live key={`live-${live.id}-${index}`} live={live} />
      )}
      currentPage={currentPage}
      filter={filter}
      setCurrentPage={(page) => setCurrentPage(page)}
      setFilter={(newFilter) => setFilter(newFilter)}
      noContentMessage={intl.formatMessage(messages.NoLive)}
      withPagination={withPagination}
      withFilter={withFilter}
    />
  );
};

export default Lives;
