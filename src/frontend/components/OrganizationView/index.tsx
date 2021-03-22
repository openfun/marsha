import { Box, Heading } from 'grommet';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Route, Switch, useParams, useRouteMatch } from 'react-router-dom';

import { useOrganization } from '../../data/queries';
import { Crumb } from '../BreadCrumbs';
import { PlaylistView } from '../PlaylistView';
import { VideosList } from '../VideosList';
import { VideoView } from '../VideoView';
import { OrganizationPlaylists } from './OrganizationPlaylists';

const messages = defineMessages({
  defaultTitle: {
    defaultMessage: 'Organization',
    description:
      'Default title for the organization view when the organization has not loaded.',
    id: 'components.OrganizationView.defaultTitle',
  },
  titleVideos: {
    defaultMessage: 'Videos',
    description: 'Title for the list of videos in the organization view.',
    id: 'components.OrganizationView.titleVideos',
  },
});

interface OrganizationViewIndexRouteParams {
  organizationId: string;
}

const OrganizationViewIndex: React.FC = () => {
  const { url } = useRouteMatch();
  const { organizationId } = useParams<OrganizationViewIndexRouteParams>();
  const { data, status } = useOrganization(organizationId);

  return (
    <Box pad="large" gap="large">
      <Heading level={1}>
        {status === 'success' ? (
          data!.name
        ) : (
          <FormattedMessage {...messages.defaultTitle} />
        )}
      </Heading>
      <OrganizationPlaylists organizationId={organizationId} />

      <Box direction="column">
        <Heading level={2}>
          <FormattedMessage {...messages.titleVideos} />
        </Heading>
        <VideosList
          params={{ organization: organizationId }}
          getRowLink={(video) => `${url}/video/${video.id}`}
        />
      </Box>
    </Box>
  );
};

interface OrganizationViewRouteParams {
  organizationId: string;
}

export const OrganizationView: React.FC = () => {
  const { path } = useRouteMatch();
  const { organizationId } = useParams<OrganizationViewRouteParams>();
  const { data, status } = useOrganization(organizationId);

  return (
    <React.Fragment>
      <Crumb
        title={
          status === 'success' ? (
            <span>{data!.name}</span>
          ) : (
            <FormattedMessage {...messages.defaultTitle} />
          )
        }
      />
      <Switch>
        <Route path={`${path}/playlist/:playlistId`}>
          <PlaylistView />
        </Route>

        <Route path={`${path}/video/:videoId`}>
          <VideoView />
        </Route>

        <Route path={path}>
          <OrganizationViewIndex />
        </Route>
      </Switch>
    </React.Fragment>
  );
};
