import { useClassrooms } from 'lib-classroom';
import { Fragment, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { REACT_QUERY_CONF_API } from 'conf/global';
import {
  ContentsFilter,
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
  limit?: number;
}

const ClassRooms = ({ withPagination = true, limit }: ClassRoomsProps) => {
  const intl = useIntl();
  const [currentPage, setCurrentPage] = useState(1);
  const contentPerPage = useContentPerPage();
  const [filter, setFilter] = useState<{
    playlist: string;
  }>({
    playlist: '',
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
    <Fragment>
      <ContentsFilter setFilter={(newFilter) => setFilter(newFilter)} />
      <ContentsWrapper
        apiResponse={apiResponse}
        dataComponent={(classroom, index) => (
          <ClassRoomItem
            key={`classroom-${classroom.id}-${index}`}
            classroom={classroom}
          />
        )}
        currentPage={currentPage}
        setCurrentPage={(page) => setCurrentPage(page)}
        noContentMessage={intl.formatMessage(messages.NoClassroom)}
        withPagination={withPagination}
      />
    </Fragment>
  );
};

export default ClassRooms;
