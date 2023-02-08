import { Box } from 'grommet';
import { Route, Switch } from 'react-router-dom';

import Videos from './Read/Videos';

const VideoRouter = () => {
  return (
    <Box pad="medium">
      <Switch>
        <Route>
          <Videos />
        </Route>
      </Switch>
    </Box>
  );
};

export default VideoRouter;
