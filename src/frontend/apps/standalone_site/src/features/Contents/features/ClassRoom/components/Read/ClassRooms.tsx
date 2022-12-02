import { Pagination } from 'grommet';
import { useClassrooms } from 'lib-classroom';
import { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { ContentCards } from 'components/Cards';
import ManageAPIState from 'components/ManageAPIState/';
import { ITEM_PER_PAGE } from 'conf/global';

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

  const {
    isLoading,
    isError,
    data: classRooms,
  } = useClassrooms(
    {
      offset: `${(currentPage - 1) * ITEM_PER_PAGE}`,
      limit: `${limit || ITEM_PER_PAGE}`,
    },
    { keepPreviousData: true, staleTime: 20000 },
  );

  return (
    <ManageAPIState
      isError={isError}
      isLoading={isLoading}
      itemsLength={classRooms?.results.length || 0}
      nothingToDisplay={intl.formatMessage(messages.NoClassroom)}
    >
      <ContentCards>
        {classRooms?.results.map((classroom) => (
          <ClassRoomItem
            key={`classroom-${classroom.id}`}
            classroom={classroom}
          />
        ))}
      </ContentCards>
      {(classRooms?.count || 0) > ITEM_PER_PAGE && withPagination && (
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
    </ManageAPIState>
  );
};

export default ClassRooms;
