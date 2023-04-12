import { useClassrooms } from 'lib-classroom';
import { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { REACT_QUERY_CONF_API } from 'conf/global';
import {
  ContentFilter,
  ContentsWrapper,
  useContentPerPage,
} from 'features/Contents/';

import ClassRoomItem from './ClassRoomItem';

const messages = defineMessages({
  NoClassroom: {
    defaultMessage: 'There is no classroom to display.',
    description: 'Text when there is no classroom to display.',
    id: 'features.Contents.features.ClassRooms.NoClassroom',
  },
});

interface ClassRoomsProps {
  withPagination?: boolean;
  withFilter?: boolean;
  limit?: number;
  playlistId?: string;
}

const ClassRooms = ({
  withPagination = true,
  withFilter = true,
  playlistId = '',
  limit,
}: ClassRoomsProps) => {
  const intl = useIntl();
  const [currentPage, setCurrentPage] = useState(1);
  const contentPerPage = useContentPerPage();
  const [filter, setFilter] = useState<ContentFilter>({
    playlist: playlistId,
  });

  const apiResponse = useClassrooms(
    {
      offset: `${(currentPage - 1) * contentPerPage}`,
      limit: `${limit || contentPerPage}`,
      playlist: filter.playlist,
    },
    REACT_QUERY_CONF_API,
  );

  return (
    <ContentsWrapper
      apiResponse={apiResponse}
      dataComponent={(classroom, index) => (
        <ClassRoomItem
          key={`classroom-${classroom.id}-${index}`}
          classroom={classroom}
        />
      )}
      currentPage={currentPage}
      filter={filter}
      setCurrentPage={(page) => setCurrentPage(page)}
      setFilter={(newFilter) => setFilter(newFilter)}
      noContentMessage={intl.formatMessage(messages.NoClassroom)}
      withPagination={withPagination}
      withFilter={withFilter}
    />
  );
};

export default ClassRooms;
