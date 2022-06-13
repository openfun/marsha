import { Box, Spinner } from 'grommet';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { ErrorMessage } from 'components/ErrorComponents';
import { useStatsVideo } from 'data/queries';
import { Video } from 'types/tracks';

const messages = defineMessages({
  loadingStats: {
    defaultMessage: 'Loading stats...',
    description:
      'Accessible message for the spinner while loading the video stats in dashboard view.',
    id: 'component.DashboardVideoPaneStats.loadingStats',
  },
  viewsNumber: {
    defaultMessage: 'Number of views: {nb_views}',
    description: 'Label for the video views number in dashboard view.',
    id: 'component.DashboardVideoPaneStats.viewsNumber',
  },
});

interface DashboardVideoPaneStatsProps {
  video: Video;
}

export const DashboardVideoPaneStats = ({
  video,
}: DashboardVideoPaneStatsProps) => {
  const { data: videoStats, status: useStatsVideoStatus } = useStatsVideo(
    video.id,
    { refetchInterval: false },
  );

  let content: JSX.Element;
  switch (useStatsVideoStatus) {
    case 'idle':
    case 'loading':
      content = (
        <Spinner size="large">
          <FormattedMessage {...messages.loadingStats} />
        </Spinner>
      );
      break;

    case 'error':
      content = <ErrorMessage code="generic" />;
      break;

    case 'success':
      content = (
        <React.Fragment>
          <FormattedMessage
            {...messages.viewsNumber}
            values={{ nb_views: videoStats.nb_views }}
          />
        </React.Fragment>
      );
      break;
  }

  return (
    <Box align={'center'} direction={'row'} pad={{ top: 'small' }}>
      {content}
    </Box>
  );
};
