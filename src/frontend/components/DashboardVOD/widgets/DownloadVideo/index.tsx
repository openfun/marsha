import { Box, Button, Select, Text } from 'grommet';
import React, { useMemo, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { WidgetTemplate } from 'components/common/dashboard/widgets/WidgetTemplate';
import { useCurrentVideo } from 'data/stores/useCurrentRessource/useCurrentVideo';
import { videoSize } from 'types/tracks';

const messages = defineMessages({
  info: {
    defaultMessage:
      'This widget allows you to download the video, with the available quality you desire.',
    description: 'Info of the widget used for downloading the video.',
    id: 'components.DownloadVideo.info',
  },
  title: {
    defaultMessage: 'Download video',
    description: 'Title of the widget used for downloading the video.',
    id: 'components.DownloadVideo.title',
  },
  selectQualityLabel: {
    defaultMessage:
      'This input allows you to select the quality you desire for your download.',
    description: 'Label of the select button.',
    id: 'components.DownloadVideo.selectQualityLabel',
  },
  noResolutionsAvailableOption: {
    defaultMessage: 'No resolutions available',
    description:
      'The disabled option displayed in the select when there is no selection to perform.',
    id: 'components.DownloadVideo.noResolutionsAvailableOption',
  },
  downloadButtonLabel: {
    defaultMessage: 'Download',
    description:
      'Label of the button used to download the video in the selected quality.',
    id: 'components.DownloadVideo.downloadButtonLabel',
  },
});

const StyledAnchorButton = styled(Button)`
  height: 50px;
  font-family: 'Roboto-Medium';
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const DownloadVideo = () => {
  const video = useCurrentVideo();

  const intl = useIntl();
  const options = Object.keys(video.urls ? video.urls.mp4 : {})
    .map((size) => Number(size) as videoSize)
    .sort((a, b) => a - b)
    .map((size) => ({
      label: `${size} p`,
      value: size.toString(),
    }));

  const isResolutionsEmpty = !options.length;

  const noResolutionsAvailableOption = useMemo(
    () => ({
      label: intl.formatMessage(messages.noResolutionsAvailableOption),
      value: 'no_resolution_available_value',
    }),
    [intl, messages],
  );

  if (isResolutionsEmpty) {
    options.push(noResolutionsAvailableOption);
  }

  const [selectedOption, setSelectedOption] = useState<{
    label: string;
    value: string;
  }>(options[options.length - 1]);

  return (
    <WidgetTemplate
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
          value={selectedOption.label}
          valueKey={{ key: 'value', reduce: true }}
          valueLabel={(label) => (
            <Box pad="small">
              <Text color="blue-active">{`${label}`}</Text>
            </Box>
          )}
          onChange={({ option }) => {
            setSelectedOption(option);
          }}
          title={intl.formatMessage(messages.selectQualityLabel)}
        />
        <StyledAnchorButton
          a11yTitle={intl.formatMessage(messages.downloadButtonLabel)}
          color="blue-active"
          download
          disabled={isResolutionsEmpty}
          fill="horizontal"
          label={intl.formatMessage(messages.downloadButtonLabel)}
          href={
            video.urls
              ? video.urls.mp4[Number(selectedOption.value) as videoSize]
              : undefined
          }
          target="_blank"
          rel="noopener noreferrer"
          primary
          title={intl.formatMessage(messages.downloadButtonLabel)}
        />
      </Box>
    </WidgetTemplate>
  );
};
