import { WithParams } from 'lib-components';
import { Fragment } from 'react';
import { Route, Routes } from 'react-router-dom';

import { routes } from 'routes';

import { UpdatePlaylistPage } from '../features/UpdatePlaylist';

import { PlaylistPage } from './PlaylistPage';

export const PlaylistRouter = () => {
  return (
    <Routes>
      <Route
        path={routes.PLAYLIST.subRoutes.UPDATE.pathKey}
        element={
          <WithParams>
            {({ id }) =>
              id ? (
                <UpdatePlaylistPage playlistId={id} />
              ) : (
                <Fragment></Fragment>
              )
            }
          </WithParams>
        }
      />
      <Route path="*" element={<PlaylistPage />} />
    </Routes>
  );
};
