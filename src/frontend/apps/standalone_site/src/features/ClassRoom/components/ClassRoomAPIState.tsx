import { Text, Box } from 'grommet';
import { Alert } from 'grommet-icons';
import { Fragment, PropsWithChildren, ReactNode } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { ReactComponent as ClassroomsIcon } from 'assets/svg/iko_webinairesvg.svg';
import { ContentSpinner } from 'components/Spinner';

const messages = defineMessages({
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

interface ClassRoomAPIStateProps {
  isLoading: boolean;
  isError: boolean;
  classRoomsLength: number;
}

function ClassRoomAPIState({
  isLoading,
  isError,
  classRoomsLength,
  children,
}: PropsWithChildren<ClassRoomAPIStateProps>) {
  const intl = useIntl();

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
  } else if (classRoomsLength) {
    content = <Fragment>{children}</Fragment>;
  }

  return content;
}

export default ClassRoomAPIState;
