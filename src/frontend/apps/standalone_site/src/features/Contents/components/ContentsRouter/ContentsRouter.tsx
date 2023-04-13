import { Route, Switch } from 'react-router-dom';

import { Contents } from 'features/Contents';
import { routes } from 'routes';

import { useContentFeatures } from '../../store/contentsStore';

const ContentsRouter = () => {
  const { featureRoutes } = useContentFeatures((state) => ({
    featureRoutes: state.featureRoutes,
  }));

  return (
    <Switch>
      <Route path={routes.CONTENTS.path} exact>
        <Contents />
      </Route>
      <Route>{featureRoutes}</Route>
    </Switch>
  );
};

export default ContentsRouter;
