import { Text, Box, Pagination } from 'grommet';
import { Alert } from 'grommet-icons';
import { useClassrooms } from 'lib-classroom';
import { Fragment, PropsWithChildren, ReactNode, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { ReactComponent as ClassroomsIcon } from 'assets/svg/iko_webinairesvg.svg';
import { ContentCards } from 'components/Cards';
import { ContentSpinner } from 'components/Spinner';
import { ITEM_PER_PAGE } from 'conf/global';

import ClassRoomItem from './ClassRoomItem';

const messages = defineMessages({
  ClassroomTitle: {
    defaultMessage: 'Classrooms',
    description: 'Classrooms title',
    id: 'features.ClassRooms.Create.ClassroomTitle',
  },
  NoClassroom: {
    defaultMessage: 'There is no classroom to display.',
    description: 'Text when there is no classroom to display.',
    id: 'features.ClassRooms.NoClassroom',
  },
  Error: {
    defaultMessage: 'Sorry, an error has occurred.',
    description: 'Text when there is an error.',
    id: 'features.ClassRooms.Error',
  },
});

const ContainerInfo = ({ children }: PropsWithChildren<ReactNode>) => {
  return (
    <Box
      direction="row"
      align="center"
      justify="center"
      margin={{ top: 'medium' }}
      gap="small"
    >
      {children}
    </Box>
  );
};

function ClassRooms() {
  const intl = useIntl();
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

  let content = (
    <ContainerInfo>
      <ClassroomsIcon width={80} height={80} />
      <Text weight="bold">{intl.formatMessage(messages.NoClassroom)}</Text>
    </ContainerInfo>
  );

  if (isError) {
    content = (
      <ContainerInfo>
        <Alert size="large" color="#df8c00" />
        <Text weight="bold">{intl.formatMessage(messages.Error)}</Text>
      </ContainerInfo>
    );
  } else if (isLoading) {
    content = <ContentSpinner />;
  } else if (classRooms?.results.length) {
    content = (
      <Fragment>
        <ContentCards>
          {classRooms.results.map((classroom) => (
            <ClassRoomItem
              key={`classroom-${classroom.id}`}
              classroom={classroom}
            />
          ))}
        </ContentCards>
        {classRooms.count > ITEM_PER_PAGE && (
          <Pagination
            numberItems={classRooms.count}
            onChange={({ page: newPage }: { page: number }) => {
              setCurrentPage(newPage);
            }}
            page={currentPage}
            step={ITEM_PER_PAGE}
            alignSelf="center"
            margin={{ top: 'medium' }}
          />
        )}
      </Fragment>
    );
  }

  return content;
}

export default ClassRooms;
