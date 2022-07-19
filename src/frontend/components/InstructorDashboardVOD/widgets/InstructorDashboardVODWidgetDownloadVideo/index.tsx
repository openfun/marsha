import { Box, Button, Select, Text } from 'grommet';
import React, { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { DashboardVideoLiveWidgetTemplate } from 'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetTemplate';
import { Video, videoSize } from 'types/tracks';

const messages = defineMessages({
  info: {
    defaultMessage:
      'This widget allows you to download the video, with the available quality you desire.',
    description: 'Info of the widget used for downloading the video.',
    id: 'components.InstructorDashboardVODWidgetDownloadVideo.info',
  },
  title: {
    defaultMessage: 'Download video',
    description: 'Title of the widget used for downloading the video.',
    id: 'components.InstructorDashboardVODWidgetDownloadVideo.title',
  },
  selectQualityLabel: {
    defaultMessage:
      'This input allows you to select the quality you desire for your download.',
    description: 'Label of the select button.',
    id: 'components.InstructorDashboardVODWidgetDownloadVideo.selectQualityLabel',
  },
  downloadButtonLabel: {
    defaultMessage: 'Download',
    description:
      'Label of the button used to download the video in the selected quality.',
    id: 'components.InstructorDashboardVODWidgetDownloadVideo.downloadButtonLabel',
  },
});

interface InstructorDashboardVODWidgetDownloadVideoProps {
  video: Video;
}

export const InstructorDashboardVODWidgetDownloadVideo = ({
  video,
}: InstructorDashboardVODWidgetDownloadVideoProps) => {
  const intl = useIntl();
  const options = Object.keys(video.urls!.mp4)
    .map((size) => Number(size) as videoSize)
    .sort((a, b) => a - b)
    .map((size) => ({
      label: `${size} p`,
      value: size.toString(),
    }));
  const [selectedOption, setSelectedOption] = useState<{
    label: string;
    value: string;
  }>(options[options.length - 1]);

  return (
    <DashboardVideoLiveWidgetTemplate
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue
      title={intl.formatMessage(messages.title)}
    >
      <Box direction="column" gap="small">
        <Select
          aria-label={intl.formatMessage(messages.selectQualityLabel)}
          options={options}
          replace={false}
          labelKey="label"
          value={selectedOption.value}
          valueKey={{ key: 'value', reduce: true }}
          valueLabel={(label) => (
            <Box pad="small">
              <Text color="blue-active">{`${label} p`}</Text>
            </Box>
          )}
          onChange={({ option }) => {
            setSelectedOption(option);
          }}
          title={intl.formatMessage(messages.selectQualityLabel)}
        />
        <Button
          a11yTitle={intl.formatMessage(messages.downloadButtonLabel)}
          color="blue-active"
          fill="horizontal"
          label={intl.formatMessage(messages.downloadButtonLabel)}
          onClick={() =>
            video.urls &&
            window.open(
              video.urls.mp4[Number(selectedOption.value) as videoSize],
            )
          }
          primary
          style={{ height: '50px', fontFamily: 'Roboto-Medium' }}
          title={intl.formatMessage(messages.downloadButtonLabel)}
        />
      </Box>
    </DashboardVideoLiveWidgetTemplate>
  );
};
