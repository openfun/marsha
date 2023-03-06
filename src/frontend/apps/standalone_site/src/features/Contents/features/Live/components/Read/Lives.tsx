import { useVideos, VideosOrderType } from 'lib-video';
import { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { REACT_QUERY_CONF_API } from 'conf/global';
import { ContentsWrapper, useContentPerPage } from 'features/Contents/';

import Live from './Live';

const messages = defineMessages({
  NoLive: {
    defaultMessage: 'There is no live to display.',
    description: 'Text when there is no live to display.',
    id: 'features.Contents.features.ReadLives.NoLive',
  },
});

interface LivesProps {
  withPagination?: boolean;
  limit?: number;
}

const Lives = ({ withPagination = true, limit }: LivesProps) => {
  const intl = useIntl();
  const [currentPage, setCurrentPage] = useState(1);
  const contentPerPage = useContentPerPage();

  const apiResponse = useVideos(
    {
      offset: `${(currentPage - 1) * contentPerPage}`,
      limit: `${limit || contentPerPage}`,
      ordering: VideosOrderType.BY_CREATED_ON_REVERSED,
      is_live: 'true',
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
      setCurrentPage={(page) => setCurrentPage(page)}
      noContentMessage={intl.formatMessage(messages.NoLive)}
      withPagination={withPagination}
    />
  );
};

export default Lives;
