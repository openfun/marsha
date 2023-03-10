import { Box, Button, Select, Text } from 'grommet';
import {
  videoSize,
  report,
  ToggleInput,
  Video,
  FoldableItem,
} from 'lib-components';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { useUpdateVideo } from 'api/useUpdateVideo';
import { useCurrentVideo } from 'hooks/useCurrentVideo';

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
  allowDownloadToggleLabel: {
    defaultMessage: 'Allow video download',
    description: 'Label of the toggle used to allowed the video download.',
    id: 'components.DownloadVideo.enableDownloadToggleLabel',
  },
  allowDownloadToggleSuccess: {
    defaultMessage: 'Video download allowed.',
    description: 'Message displayed when allowing download video succeded.',
    id: 'components.DownloadVideo.enableDownloadToggleSuccess',
  },
  disallowDownloadToggleSuccess: {
    defaultMessage: 'Video download disallowed.',
    description: 'Message displayed when disallowing download video succeded.',
    id: 'components.DownloadVideo.disallowDownloadToggleSuccess',
  },
  allowDownloadToggleFail: {
    defaultMessage: 'Update failed, try again.',
    description: 'Message displayed when allowing download video has failed.',
    id: 'components.DownloadVideo.allowDownloadToggleFail',
  },
});

const StyledAnchorButton = styled(Button)`
  height: 50px;
  font-family: 'Roboto-Medium';
  display: flex;
  align-items: center;
  justify-content: center;
`;

interface DownloadVideoProps {
  isTeacher: boolean;
}

export const DownloadVideo = ({ isTeacher }: DownloadVideoProps) => {
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
    [intl],
  );

  if (isResolutionsEmpty) {
    options.push(noResolutionsAvailableOption);
  }

  const [selectedOption, setSelectedOption] = useState<{
    label: string;
    value: string;
  }>(options[options.length - 1]);

  const [toggleAllowDownload, setToggleAllowDownload] = useState(
    video.show_download,
  );

  useEffect(() => {
    setToggleAllowDownload(video.show_download);
  }, [video.show_download]);

  const [disabledToggle, setDisabledToggle] = useState(false);

  const videoMutation = useUpdateVideo(video.id, {
    onSuccess: (videoUpdated: Video) => {
      setToggleAllowDownload(videoUpdated.show_download);
      toast.success(
        intl.formatMessage(
          videoUpdated.show_download
            ? messages.allowDownloadToggleSuccess
            : messages.disallowDownloadToggleSuccess,
        ),
        {
          position: 'bottom-center',
        },
      );
    },
    onError: (err) => {
      report(err);
      toast.error(intl.formatMessage(messages.allowDownloadToggleFail), {
        position: 'bottom-center',
      });
    },
    onMutate: () => {
      setDisabledToggle(true);
    },
    onSettled: () => {
      setDisabledToggle(false);
    },
  });

  const onToggleChange = useCallback(() => {
    videoMutation.mutate({
      show_download: !video.show_download,
    });
  }, [video.show_download, videoMutation]);

  if (!isTeacher && !toggleAllowDownload) {
    return null;
  }

  return (
    <FoldableItem
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue
      title={intl.formatMessage(messages.title)}
    >
      {isTeacher && (
        <ToggleInput
          disabled={disabledToggle}
          checked={toggleAllowDownload}
          onChange={onToggleChange}
          label={intl.formatMessage(messages.allowDownloadToggleLabel)}
          truncateLabel={false}
        />
      )}
      <Box direction="column" gap="small" style={{ marginTop: '0.75rem' }}>
        <Select
          aria-label={intl.formatMessage(messages.selectQualityLabel)}
          options={options}
          replace={false}
          labelKey="label"
          value={selectedOption.label}
          valueKey={{ key: 'value', reduce: true }}
          valueLabel={(label: string) => (
            <Box pad="small">
              <Text color="blue-active">{`${label}`}</Text>
            </Box>
          )}
          onChange={({
            option,
          }: {
            option: { label: string; value: string };
          }) => {
            setSelectedOption(option);
          }}
          title={intl.formatMessage(messages.selectQualityLabel)}
        />
        <StyledAnchorButton
          a11yTitle={intl.formatMessage(messages.downloadButtonLabel)}
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
    </FoldableItem>
  );
};
