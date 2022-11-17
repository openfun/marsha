import { Box } from 'grommet';
import { Route, Switch } from 'react-router-dom';

import { routes } from 'routes';

import ClassRoomCreate from './Create/ClassRoomCreate';
import ClassRooms from './Read/ClassRooms';
import ClassRoomUpdate from './Update/ClassRoomUpdate';

function ClassRoom() {
  const classroomRoute = routes.CONTENTS.subRoutes.CLASSROOM;
  const contentPath = routes.CONTENTS.path;
  const classroomPath = classroomRoute.path;
  const classroomCreatePath = classroomRoute.subRoutes?.CREATE?.path || '';
  const classroomUpdatePath = classroomRoute.subRoutes?.UPDATE?.path || '';

  return (
    <Box pad="medium">
      <Switch>
        <Route path={[classroomPath, classroomCreatePath, contentPath]} exact>
          <ClassRoomCreate />
          <ClassRooms />
        </Route>
        <Route path={classroomUpdatePath} exact>
          <ClassRoomUpdate />
        </Route>
      </Switch>
    </Box>
  );
}

export default ClassRoom;
