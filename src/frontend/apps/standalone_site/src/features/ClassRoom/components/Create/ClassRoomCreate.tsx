import { Layer, Button, Box, Heading, Text } from 'grommet';
import { FormClose } from 'grommet-icons';
import { normalizeColor } from 'grommet/utils';
import { theme } from 'lib-common';
import { Fragment } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Link, Route, Switch, useHistory } from 'react-router-dom';
import styled from 'styled-components';

import { WhiteCard } from 'components/Cards';
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
  ClassroomTitle: {
    defaultMessage: 'Classrooms',
    description: 'Classrooms title',
    id: 'features.ClassRooms.Create.ClassroomTitle',
  },
  CreateClassroomLabel: {
    defaultMessage: 'Create Classroom',
    description: 'Text heading create classroom.',
    id: 'features.ClassRooms.Create.CreateClassroomLabel',
  },
});

function ClassRoomCreate() {
  const intl = useIntl();
  const { isDesktop, breakpoint } = useResponsive();
  const history = useHistory();

  const classroomRoute = routes.CONTENTS.subRoutes.CLASSROOM;
  const classroomPath = classroomRoute.path;
  const classroomCreatePath =
    routes.CONTENTS.subRoutes.CLASSROOM.subRoutes?.CREATE?.path || '';

  return (
    <Fragment>
      <WhiteCard
        flex="shrink"
        direction={breakpoint === 'xxsmall' ? 'column' : 'row'}
        gap={breakpoint === 'xxsmall' ? 'small' : 'none'}
        justify="between"
        align="center"
        height={{ min: '5rem' }}
        margin={{ bottom: 'medium' }}
      >
        <Text size="large" weight="bold">
          {intl.formatMessage(messages.ClassroomTitle)}
        </Text>
        <Link to={classroomCreatePath}>
          <Button
            primary
            label={intl.formatMessage(messages.CreateClassroomLabel)}
          />
        </Link>
      </WhiteCard>
      <Switch>
        <Route path={classroomCreatePath} exact>
          <Layer
            onEsc={() => history.push(classroomPath)}
            onClickOutside={() => history.push(classroomPath)}
          >
            <Box
              width={isDesktop ? { max: '650px', width: '80vw' } : undefined}
              pad="medium"
            >
              <FormCloseIcon
                color="white"
                onClick={() => history.push(classroomPath)}
              />
              <Heading
                level={2}
                margin={{ top: 'xxsmall' }}
                textAlign="center"
                weight="bold"
              >
                {intl.formatMessage(messages.CreateClassroomLabel)}
              </Heading>
              <ClassroomCreateForm
                onSubmit={() => history.push(classroomPath)}
              />
            </Box>
          </Layer>
        </Route>
      </Switch>
    </Fragment>
  );
}

export default ClassRoomCreate;
