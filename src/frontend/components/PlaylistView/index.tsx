import { Box, Heading } from 'grommet';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Route, Switch, useParams, useRouteMatch } from 'react-router-dom';

import { usePlaylist } from '../../data/queries';
import { Crumb } from '../BreadCrumbs';
import { VideoCreateForm } from '../VideoCreateForm';
import { VideosList } from '../VideosList';
import { VideoView } from '../VideoView';

const messages = defineMessages({
  addVideos: {
    defaultMessage: 'Add new videos',
    description:
      'Title for the part of the playlist view that lets users add new videos.',
    id: 'components.PlaylistView.addVideos',
  },
  defaultTitle: {
    defaultMessage: 'Playlist',
    description:
      'Default title for the playlist view when the playlist has not loaded.',
    id: 'components.PlaylistView.defaultTitle',
  },
  titleVideos: {
    defaultMessage: 'Videos',
    description: 'Title for the list of videos in the playlist view.',
    id: 'components.PlaylistView.titleVideos',
  },
});

interface PlaylistViewIndexRouteParams {
  playlistId: string;
}

const PlaylistViewIndex: React.FC = () => {
  const { url } = useRouteMatch();
  const { playlistId } = useParams<PlaylistViewIndexRouteParams>();
  const { data, status } = usePlaylist(playlistId);

  return (
    <Box pad="large">
      <Heading level={1}>
        {status === 'success' ? (
          data!.title
        ) : (
          <FormattedMessage {...messages.defaultTitle} />
        )}
      </Heading>

      <Box direction="column" gap="medium">
        <Heading level={2} margin="none">
          <FormattedMessage {...messages.titleVideos} />
        </Heading>
        <VideosList
          params={{ playlist: playlistId }}
          getRowLink={(video) => `${url}/video/${video.id}`}
        />
        <Heading level={2} margin="none">
          <FormattedMessage {...messages.addVideos} />
        </Heading>
        <VideoCreateForm playlist={playlistId} />
      </Box>
    </Box>
  );
};

interface PlaylistViewRouteParams {
  playlistId: string;
}

export const PlaylistView: React.FC = () => {
  const { path } = useRouteMatch();
  const { playlistId } = useParams<PlaylistViewRouteParams>();
  const { data, status } = usePlaylist(playlistId);

  return (
    <React.Fragment>
      <Crumb
        title={
          status === 'success' ? (
            <span>{data!.title}</span>
          ) : (
            <FormattedMessage {...messages.defaultTitle} />
          )
        }
      />

      <Switch>
        <Route path={`${path}/video/:videoId`}>
          <VideoView />
        </Route>

        <Route path={path}>
          <PlaylistViewIndex />
        </Route>
      </Switch>
    </React.Fragment>
  );
};
