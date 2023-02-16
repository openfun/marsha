import { Box, Grid, Text } from 'grommet';
import { useCurrentVideo } from 'hooks';
import { Loader } from 'lib-components';
import React, { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { useStatsVideo } from 'hooks/useVideoStats';

const messages = defineMessages({
  viewersStatsDescription: {
    defaultMessage:
      '{viewers, plural, =0 {Viewers} one {Viewer} other {Viewers}}',
    description: 'Description of the number of viewers',
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
  const intl = useIntl();
  const video = useCurrentVideo();
  const [metrics, setMetrics] = useState<MetricsDataType>([]);
  const { isLoading } = useStatsVideo(video.id, {
    onSuccess(data) {
      setMetrics([
        [
          {
            value: data.nb_views,
            description: intl.formatMessage(messages.viewersStatsDescription, {
              viewers: data.nb_views,
            }),
          },
        ],
      ]);
    },
  });

  if (isLoading) {
    return <Loader />;
  }

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
