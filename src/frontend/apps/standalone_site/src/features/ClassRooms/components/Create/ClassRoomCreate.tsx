import { Layer, Button, Box, Heading } from 'grommet';
import { FormClose } from 'grommet-icons';
import { normalizeColor } from 'grommet/utils';
import { theme } from 'lib-common';
import { Fragment } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Link, useLocation, useHistory } from 'react-router-dom';
import styled from 'styled-components';

import { useResponsive } from 'hooks/useResponsive';
import { routes } from 'routes';

import ClassroomCreateForm from './ClassRoomCreateForm';

const FormCloseIcon = styled(FormClose)`
  background-color: ${normalizeColor('blue-active', theme)};
  border-radius: 100%;
  align-self: end;
  cursor: pointer;
`;

const messages = defineMessages({
  HeadingCreateClassroom: {
    defaultMessage: 'Create Classroom',
    description: 'Text heading create classroom.',
    id: 'features.ClassRooms.Create.HeadingCreateClassroom',
  },
});

function ClassRoomCreate() {
  const intl = useIntl();
  const history = useHistory();
  const { pathname } = useLocation();
  const { isDesktop } = useResponsive();

  const ClassroomsRoute = routes.CONTENTS.subRoutes.CLASSROOM;
  const CreateRoute = ClassroomsRoute.subRoutes?.CREATE;

  return (
    <Fragment>
      <Link to={CreateRoute?.path || ''}>
        <Button primary label={CreateRoute?.label} />
      </Link>
      {CreateRoute?.path === pathname && (
        <Layer
          onEsc={() => history.push(ClassroomsRoute.path)}
          onClickOutside={() => history.push(ClassroomsRoute.path)}
        >
          <Box
            width={isDesktop ? { max: '650px', width: '80vw' } : undefined}
            pad="medium"
          >
            <FormCloseIcon
              color="white"
              onClick={() => history.push(ClassroomsRoute.path)}
            />
            <Heading
              level={2}
              margin={{ top: 'xxsmall' }}
              textAlign="center"
              weight="bold"
            >
              {intl.formatMessage(messages.HeadingCreateClassroom)}
            </Heading>
            <ClassroomCreateForm
              onSubmit={() => history.push(ClassroomsRoute.path)}
            />
          </Box>
        </Layer>
      )}
    </Fragment>
  );
}

export default ClassRoomCreate;
