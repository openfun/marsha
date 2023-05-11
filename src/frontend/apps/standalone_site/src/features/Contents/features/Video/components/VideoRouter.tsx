import { Box } from 'grommet';
import { Route, Switch, useLocation } from 'react-router-dom';

import { routes } from 'routes/routes';

import VideoCreate from './Create/VideoCreate';
import Videos from './Read/Videos';
import VideoUpdate from './Update/VideoUpdate';

const VideoRouter = () => {
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const playlistId = searchParams.get('playlist') || '';

  const videoRoute = routes.CONTENTS.subRoutes.VIDEO;
  const videoCreatePath = videoRoute.subRoutes?.CREATE?.path || '';
  const videoUpdatePath = videoRoute.subRoutes?.UPDATE?.path || '';

  return (
    <Route path={videoRoute.path}>
      <Box pad="medium">
        <Switch>
          <Route path={videoCreatePath} exact>
            <VideoCreate />
            <Videos playlistId={playlistId} />
          </Route>
          <Route path={videoUpdatePath} exact>
            <VideoUpdate />
          </Route>
          <Route>
            <VideoCreate />
            <Videos playlistId={playlistId} />
          </Route>
        </Switch>
      </Box>
    </Route>
  );
};

export default VideoRouter;
