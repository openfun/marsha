import { Box } from 'grommet';
import { Route, Switch, useLocation } from 'react-router-dom';

import { routes } from 'routes';

import ClassRoomCreate from './Create/ClassRoomCreate';
import ClassRooms from './Read/ClassRooms';
import ClassRoomUpdate from './Update/ClassRoomUpdate';

const ClassRoomRouter = () => {
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const playlistId = searchParams.get('playlist') || '';

  const classroomRoute = routes.CONTENTS.subRoutes.CLASSROOM;
  const classroomCreatePath = classroomRoute.subRoutes?.CREATE?.path || '';
  const classroomUpdatePath = classroomRoute.subRoutes?.UPDATE?.path || '';
  const classroomInvitePath = classroomRoute.subRoutes?.INVITE?.path || '';

  return (
    <Route path={classroomRoute.path}>
      <Box pad="medium">
        <Switch>
          <Route path={classroomCreatePath} exact>
            <ClassRoomCreate />
            <ClassRooms playlistId={playlistId} />
          </Route>
          <Route path={[classroomInvitePath, classroomUpdatePath]} exact>
            <ClassRoomUpdate />
          </Route>
          <Route>
            <ClassRoomCreate />
            <ClassRooms playlistId={playlistId} />
          </Route>
        </Switch>
      </Box>
    </Route>
  );
};

export default ClassRoomRouter;
