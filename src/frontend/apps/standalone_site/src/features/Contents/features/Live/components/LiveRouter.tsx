import { Box } from 'grommet';
import { Route, Switch, useLocation } from 'react-router-dom';

import { routes } from 'routes';

import LiveCreate from './Create/LiveCreate';
import Lives from './Read/Lives';
import LiveUpdate from './Update/LiveUpdate';

const LiveRouter = () => {
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const playlistId = searchParams.get('playlist') || '';

  const liveRoute = routes.CONTENTS.subRoutes.LIVE;
  const liveCreatePath = liveRoute.subRoutes?.CREATE?.path || '';
  const liveUpdatePath = liveRoute.subRoutes?.UPDATE?.path || '';

  return (
    <Route path={liveRoute.path}>
      <Box pad="medium">
        <Switch>
          <Route path={liveCreatePath} exact>
            <LiveCreate />
            <Lives playlistId={playlistId} />
          </Route>
          <Route path={liveUpdatePath} exact>
            <LiveUpdate />
          </Route>
          <Route>
            <LiveCreate />
            <Lives playlistId={playlistId} />
          </Route>
        </Switch>
      </Box>
    </Route>
  );
};

export default LiveRouter;
