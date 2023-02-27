import { Box } from 'grommet';
import { Route, Switch } from 'react-router-dom';

import { routes } from 'routes';

import VideoCreate from './Create/VideoCreate';
import Videos from './Read/Videos';
import VideoUpdate from './Update/VideoUpdate';

const VideoRouter = () => {
  const videoRoute = routes.CONTENTS.subRoutes.VIDEO;
  const videoCreatePath = videoRoute.subRoutes?.CREATE?.path || '';
  const videoUpdatePath = videoRoute.subRoutes?.UPDATE?.path || '';

  return (
    <Box pad="medium">
      <Switch>
        <Route path={videoCreatePath} exact>
          <VideoCreate />
          <Videos />
        </Route>
        <Route path={videoUpdatePath} exact>
          <VideoUpdate />
        </Route>
        <Route>
          <VideoCreate />
          <Videos />
        </Route>
      </Switch>
    </Box>
  );
};

export default VideoRouter;
