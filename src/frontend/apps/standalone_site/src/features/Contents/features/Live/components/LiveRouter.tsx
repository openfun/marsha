import { Box } from 'grommet';
import { Route, Switch } from 'react-router-dom';

import Lives from './Read/Lives';

const LiveRouter = () => {
  return (
    <Box pad="medium">
      <Switch>
        <Route>
          <Lives />
        </Route>
      </Switch>
    </Box>
  );
};

export default LiveRouter;
