import { Button, Heading, Text } from 'grommet';
import { useResponsive } from 'lib-components';
import { Fragment } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Link, Route, Switch, useHistory } from 'react-router-dom';

import { WhiteCard } from 'components/Cards';
import { Modal } from 'components/Modal';
import { routes } from 'routes';

import ClassroomCreateForm from './ClassRoomCreateForm';

const messages = defineMessages({
  ClassroomTitle: {
    defaultMessage: 'Classrooms',
    description: 'Classrooms title',
    id: 'features.Contents.features.ClassRooms.Create.ClassroomTitle',
  },
  CreateClassroomLabel: {
    defaultMessage: 'Create Classroom',
    description: 'Text heading create classroom.',
    id: 'features.Contents.features.ClassRooms.Create.CreateClassroomLabel',
  },
});

const ClassRoomCreate = () => {
  const intl = useIntl();
  const { breakpoint } = useResponsive();
  const history = useHistory();

  const classroomRoute = routes.CONTENTS.subRoutes.CLASSROOM;
  const classroomPath = classroomRoute.path;
  const classroomCreatePath = classroomRoute.subRoutes?.CREATE?.path || '';

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
          <Modal
            isOpen
            onClose={() => {
              history.push(classroomPath);
            }}
          >
            <Heading
              level={2}
              margin={{ top: 'xxsmall' }}
              textAlign="center"
              weight="bold"
            >
              {intl.formatMessage(messages.CreateClassroomLabel)}
            </Heading>
            <ClassroomCreateForm />
          </Modal>
        </Route>
      </Switch>
    </Fragment>
  );
};

export default ClassRoomCreate;
