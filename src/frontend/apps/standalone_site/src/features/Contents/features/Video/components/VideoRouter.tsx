import { Box } from 'grommet';
import { Route, Switch, useLocation } from 'react-router-dom';

import routes from '../routes';

import VideoManage from './Manage/VideoManage';
import Videos from './Read/Videos';
import VideoUpdate from './Update/VideoUpdate';

const VideoRouter = () => {
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const playlistId = searchParams.get('playlist') || '';

  const videoRoute = routes.VIDEO;
  const videoCreatePath = videoRoute.subRoutes.CREATE.path;
  const videoUpdatePath = videoRoute.subRoutes.UPDATE.path;

  return (
    <Route path={videoRoute.path}>
      <Box pad="medium">
        <Switch>
          <Route path={videoCreatePath} exact>
            <VideoManage />
            <Videos playlistId={playlistId} />
          </Route>
          <Route path={videoUpdatePath} exact>
            <VideoUpdate />
          </Route>
          <Route>
            <VideoManage />
            <Videos playlistId={playlistId} />
          </Route>
        </Switch>
      </Box>
    </Route>
  );
};

export default VideoRouter;
