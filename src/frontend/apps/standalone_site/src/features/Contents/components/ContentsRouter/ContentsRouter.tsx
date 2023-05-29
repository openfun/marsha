import { Route, Switch } from 'react-router-dom';

import { Text404 } from 'components/Text';

import useContentRoutes from '../../hooks/useContentRoutes';
import { useContentFeatures } from '../../store/contentsStore';
import Contents from '../Contents/Contents';

const ContentsRouter = () => {
  const { featureRouter } = useContentFeatures((state) => ({
    featureRouter: state.featureRouter,
  }));
  const routes = useContentRoutes();

  const paths = Object.values(routes.CONTENTS.subRoutes).map(
    (subRoute) => subRoute.path,
  );

  return (
    <Switch>
      <Route path={routes.CONTENTS.path} exact>
        <Contents />
      </Route>
      <Route path={paths}>{featureRouter}</Route>
      <Route>
        <Text404 />
      </Route>
    </Switch>
  );
};

export default ContentsRouter;
