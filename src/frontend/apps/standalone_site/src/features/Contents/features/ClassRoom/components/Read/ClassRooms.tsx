import { useClassrooms } from 'lib-classroom';
import { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { REACT_QUERY_CONF_API } from 'conf/global';
import {
  ContentFilter,
  ContentsWrapper,
  useContentPerPage,
} from 'features/Contents/';

import routes from '../../routes';

import ClassRoomItem from './ClassRoomItem';

const messages = defineMessages({
  MyClassrooms: {
    defaultMessage: 'My Classrooms',
    description: 'My contents page, my classrooms title',
    id: 'features.Contents.features.ClassRoomContents.MyClassrooms',
  },
  NoClassroom: {
    defaultMessage: 'There is no classroom to display.',
    description: 'Text when there is no classroom to display.',
    id: 'features.Contents.features.ClassRooms.NoClassroom',
  },
});

export const classRoomContents = (playlistId?: string) => ({
  title: messages.MyClassrooms,
  route: routes.CLASSROOM.path,
  component: (
    <ClassRooms
      withPagination={false}
      limit={4}
      playlistId={playlistId}
      withFilter={false}
    />
  ),
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
