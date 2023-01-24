import { Route, Switch } from 'react-router-dom';

import { UpdatePlaylistPage } from '../features/UpdatePlaylist';

import { PlaylistPage } from './PlaylistPage';

export const PlaylistRouter = () => {
  return (
    <Switch>
      <Route path="/my-playlists/:id/update" component={UpdatePlaylistPage} />

      <PlaylistPage />
    </Switch>
  );
};
