import { Pagination } from 'grommet';
import { useClassrooms } from 'lib-classroom';
import { useState } from 'react';

import { ContentCards } from 'components/Cards';
import { ITEM_PER_PAGE } from 'conf/global';

import ClassRoomAPIState from '../ClassRoomAPIState';

import ClassRoomItem from './ClassRoomItem';

function ClassRooms() {
  const [currentPage, setCurrentPage] = useState(1);

  const {
    isLoading,
    isError,
    data: classRooms,
  } = useClassrooms(
    {
      offset: `${(currentPage - 1) * ITEM_PER_PAGE}`,
      limit: `${ITEM_PER_PAGE}`,
    },
    { keepPreviousData: true, staleTime: 20000 },
  );

  return (
    <ClassRoomAPIState
      isError={isError}
      isLoading={isLoading}
      classRoomsLength={classRooms?.results.length || 0}
    >
      <ContentCards>
        {classRooms?.results.map((classroom) => (
          <ClassRoomItem
            key={`classroom-${classroom.id}`}
            classroom={classroom}
          />
        ))}
      </ContentCards>
      {(classRooms?.count || 0) > ITEM_PER_PAGE && (
        <Pagination
          numberItems={classRooms?.count || 0}
          onChange={({ page: newPage }: { page: number }) => {
            setCurrentPage(newPage);
          }}
          page={currentPage}
          step={ITEM_PER_PAGE}
          alignSelf="center"
          margin={{ top: 'medium' }}
        />
      )}
    </ClassRoomAPIState>
  );
}

export default ClassRooms;
