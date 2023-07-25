import { Box } from 'grommet';
import { Fragment } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import { Text404 } from 'components/Text';

import routes from '../routes';

import VideoManage from './Manage/VideoManage';
import Videos from './Read/Videos';
import VideoUpdate from './Update/VideoUpdate';

const VideoRouter = () => {
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const playlistId = searchParams.get('playlist') || '';

  const videoRoute = routes.VIDEO;
  const videoCreatePath = videoRoute.subRoutes.CREATE.pathKey || '';
  const videoUpdatePath = videoRoute.subRoutes.UPDATE.pathKey;

  return (
    <Box pad="medium">
      <Routes>
        <Route path={videoUpdatePath} element={<VideoUpdate />} />
        {[`${videoCreatePath}/*`, ''].map((path, index) => {
          return (
            <Route
              path={path}
              element={
                <Fragment>
                  <VideoManage />
                  <Videos playlistId={playlistId} />
                </Fragment>
              }
              key={`${path}-${index}`}
            />
          );
        })}
        <Route path="*" element={<Text404 />} />
      </Routes>
    </Box>
  );
};

export default VideoRouter;
