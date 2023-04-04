import { Box } from 'grommet';
import { Route, Switch } from 'react-router-dom';

import { routes } from 'routes';

import ClassRoomCreate from './Create/ClassRoomCreate';
import ClassRooms from './Read/ClassRooms';
import ClassRoomUpdate from './Update/ClassRoomUpdate';

const ClassRoomRouter = () => {
  const classroomRoute = routes.CONTENTS.subRoutes.CLASSROOM;
  const classroomCreatePath = classroomRoute.subRoutes?.CREATE?.path || '';
  const classroomUpdatePath = classroomRoute.subRoutes?.UPDATE?.path || '';
  const classroomInvitePath = classroomRoute.subRoutes?.INVITE?.path || '';

  return (
    <Box pad="medium">
      <Switch>
        <Route path={classroomCreatePath} exact>
          <ClassRoomCreate />
          <ClassRooms />
        </Route>
        <Route path={[classroomInvitePath, classroomUpdatePath]} exact>
          <ClassRoomUpdate />
        </Route>
        <Route>
          <ClassRoomCreate />
          <ClassRooms />
        </Route>
      </Switch>
    </Box>
  );
};

export default ClassRoomRouter;
