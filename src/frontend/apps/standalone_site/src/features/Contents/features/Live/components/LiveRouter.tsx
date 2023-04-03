import { Box } from 'grommet';
import { Route, Switch } from 'react-router-dom';

import { routes } from 'routes';

import LiveCreate from './Create/LiveCreate';
import Lives from './Read/Lives';

const LiveRouter = () => {
  const liveRoute = routes.CONTENTS.subRoutes.LIVE;
  const liveCreatePath = liveRoute.subRoutes?.CREATE?.path || '';

  return (
    <Box pad="medium">
      <Switch>
        <Route path={liveCreatePath} exact>
          <LiveCreate />
          <Lives />
        </Route>
        <Route>
          <LiveCreate />
          <Lives />
        </Route>
      </Switch>
    </Box>
  );
};

export default LiveRouter;
