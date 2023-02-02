import { Box, Grid, Text } from 'grommet';
import { useCurrentVideo } from 'hooks';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { useStatsVideo } from 'hooks/useVideoStats';

const messages = defineMessages({
  viewersStatsDescription: {
    defaultMessage: 'People present on the whole webinar',
    description:
      'Description of the number of people present on the whole webinar',
    id: 'components.DashboardControlPane.DashboardTabStatistics.viewersStatsDescription',
  },
});

interface Metric {
  value: number | string;
  sign?: string;
  description: string;
}

type MetricsDataType = Metric[][];

export const DashboardTabStatistics = () => {
  const video = useCurrentVideo();
  const stats = useStatsVideo(video.id);
  const intl = useIntl();

  const metrics: MetricsDataType = [
    [
      {
        value: stats.data?.nb_views || 0,
        description: intl.formatMessage(messages.viewersStatsDescription),
      },
    ],
  ];

  return (
    <React.Fragment>
      {metrics.map((metricsLine, metricLineIndex) => (
        <Grid
          key={`line-${metricLineIndex}`}
          columns={{ count: 3, size: 'auto' }}
          justify="start"
          gap="small"
          style={{
            boxShadow: '0px 0px 6px 0px rgba(2, 117, 180, 0.3)',
            minHeight: '70px',
            borderRadius: '6',
            backgroundColor: 'white',
          }}
          margin="small"
          pad={{ horizontal: '21px', vertical: '20px' }}
        >
          {metricsLine.map((metric, metricIndex) => (
            <Box
              key={`metric-${metricIndex}`}
              border={{ style: 'dashed', size: '1px', color: '#81ADE6' }}
              style={{ borderRadius: 6 }}
              justify="center"
              align="center"
              gap="small"
              pad={{ horizontal: '15px', vertical: '20px' }}
            >
              <Text
                color="#055FD2"
                weight="bold"
                size="40px"
                alignSelf="center"
              >
                {metric.value} {metric.sign}
              </Text>
              <Text
                color="#055FD2"
                weight="normal"
                size="16px"
                alignSelf="center"
                textAlign="center"
              >
                {metric.description}
              </Text>
            </Box>
          ))}
        </Grid>
      ))}
    </React.Fragment>
  );
};
