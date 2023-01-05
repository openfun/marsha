import { Route, Switch } from 'react-router-dom';

import { ClassRoomRouter } from 'features/Contents';
import { routes } from 'routes';

import Contents from './Contents/Contents';

const ContentsRouter = () => {
  return (
    <Switch>
      <Route path={routes.CONTENTS.path} exact>
        <Contents />
      </Route>
      <Route path={routes.CONTENTS.subRoutes.CLASSROOM.path}>
        <ClassRoomRouter />
      </Route>
    </Switch>
  );
};

export default ContentsRouter;
