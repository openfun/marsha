import { Route, Routes } from 'react-router-dom';

import { Text404 } from 'components/Text';

import useContentRoutes from '../../hooks/useContentRoutes';
import { useContentFeatures } from '../../store/contentsStore';
import Contents from '../Contents/Contents';

const ContentsRouter = () => {
  const { featureRouter } = useContentFeatures((state) => ({
    featureRouter: state.featureRouter,
  }));
  const routes = useContentRoutes();

  return (
    <Routes>
      <Route path="" element={<Contents />} />
      {Object.values(routes.CONTENTS.subRoutes).map(({ pathKey }, index) => {
        if (pathKey) {
          return (
            <Route
              path={`${pathKey}/*`}
              element={featureRouter[index]}
              key={`${pathKey}-${index}`}
            />
          );
        }

        return null;
      })}
      <Route path="*" element={<Text404 />} />
    </Routes>
  );
};

export default ContentsRouter;
