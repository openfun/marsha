import { Route, Switch } from 'react-router-dom';

import { Text404 } from 'components/Text';
import { Contents } from 'features/Contents';

import routes from '../../routes';
import { useContentFeatures } from '../../store/contentsStore';

const ContentsRouter = () => {
  const { featureRouter } = useContentFeatures((state) => ({
    featureRouter: state.featureRouter,
  }));

  const videoPath = routes.CONTENTS.subRoutes.VIDEO.path;
  const classroomPath = routes.CONTENTS.subRoutes.CLASSROOM.path;
  const webinarPath = routes.CONTENTS.subRoutes.LIVE.path;

  return (
    <Switch>
      <Route path={routes.CONTENTS.path} exact>
        <Contents />
      </Route>
      <Route path={[videoPath, classroomPath, webinarPath]}>
        {featureRouter}
      </Route>
      <Route>
        <Text404 />
      </Route>
    </Switch>
  );
};

export default ContentsRouter;
