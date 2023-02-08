import { useClassrooms } from 'lib-classroom';
import { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { ContentsWrapper, useContentPerPage } from 'features/Contents/';

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

  const apiResponse = useClassrooms(
    {
      offset: `${(currentPage - 1) * contentPerPage}`,
      limit: `${limit || contentPerPage}`,
    },
    { keepPreviousData: true, staleTime: 20000 },
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
      setCurrentPage={(page) => setCurrentPage(page)}
      noContentMessage={intl.formatMessage(messages.NoClassroom)}
      withPagination={withPagination}
    />
  );
};

export default ClassRooms;
