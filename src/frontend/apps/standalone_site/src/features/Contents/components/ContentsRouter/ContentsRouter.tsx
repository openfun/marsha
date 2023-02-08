import { Route, Switch } from 'react-router-dom';

import { ClassRoomRouter, VideoRouter } from 'features/Contents';
import { routes } from 'routes';

import Contents from '../Contents/Contents';

const ContentsRouter = () => {
  return (
    <Switch>
      <Route path={routes.CONTENTS.path} exact>
        <Contents />
      </Route>
      <Route path={routes.CONTENTS.subRoutes.CLASSROOM.path}>
        <ClassRoomRouter />
      </Route>
      <Route path={routes.CONTENTS.subRoutes.VIDEO.path}>
        <VideoRouter />
      </Route>
    </Switch>
  );
};

export default ContentsRouter;
