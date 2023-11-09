import { Fragment } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import { Text404 } from 'components/Text';

import routes from '../routes';

import LiveManage from './Manage/LiveManage';
import Lives from './Read/Lives';
import LiveUpdate from './Update/LiveUpdate';

const LiveRouter = () => {
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const playlistId = searchParams.get('playlist') || '';

  const liveRoute = routes.LIVE;
  const liveCreatePath = liveRoute.subRoutes.CREATE.pathKey || '';
  const liveUpdatePath = liveRoute.subRoutes.UPDATE.pathKey;

  return (
    <Routes>
      <Route path={liveUpdatePath} element={<LiveUpdate />} />
      {[`${liveCreatePath}/*`, ''].map((path, index) => {
        return (
          <Route
            path={path}
            element={
              <Fragment>
                <LiveManage />
                <Lives playlistId={playlistId} />
              </Fragment>
            }
            key={`${path}-${index}`}
          />
        );
      })}
      <Route path="*" element={<Text404 />} />
    </Routes>
  );
};

export default LiveRouter;
