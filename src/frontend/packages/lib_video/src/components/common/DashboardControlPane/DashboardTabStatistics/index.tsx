import { Box, BoxLoader, Grid, Text } from 'lib-components';
import React, { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { useCurrentVideo } from '@lib-video/hooks';
import { useStatsVideo } from '@lib-video/hooks/useVideoStats';

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
    return <BoxLoader boxProps={{ margin: { top: 'medium' } }} />;
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
              style={{
                border: '1px dashed #81ADE6',
              }}
              round="xsmall"
              justify="center"
              align="center"
              gap="small"
              pad={{ horizontal: '15px', vertical: '20px' }}
            >
              <Text
                weight="black"
                textAlign="center"
                style={{
                  fontSize: '40px',
                }}
              >
                {metric.value} {metric.sign}
              </Text>
              <Text size="large" textAlign="center">
                {metric.description}
              </Text>
            </Box>
          ))}
        </Grid>
      ))}
    </React.Fragment>
  );
};
