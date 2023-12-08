import { Button, Select } from '@openfun/cunningham-react';
import {
  Box,
  FoldableItem,
  ToggleInput,
  Video,
  report,
  videoSize,
} from 'lib-components';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { useUpdateVideo } from '@lib-video/api/useUpdateVideo';
import { useCurrentVideo } from '@lib-video/hooks/useCurrentVideo';

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
  selectDownloadQualityLabel: {
    defaultMessage: 'Download quality',
    description: 'Label of the select button.',
    id: 'components.DownloadVideo.selectDownloadQualityLabel',
  },
  selectQualityInfo: {
    defaultMessage: 'Select the quality you desire for your download.',
    description: 'Text explaining the select button.',
    id: 'components.DownloadVideo.selectQualityInfo',
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

  const [selectedQuality, setSelectedQuality] = useState(
    options[options.length - 1].value,
  );

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
        />
      )}
      <Box gap="small" margin={{ top: '0.75rem' }}>
        <Select
          aria-label={intl.formatMessage(messages.selectDownloadQualityLabel)}
          label={intl.formatMessage(messages.selectDownloadQualityLabel)}
          options={options}
          fullWidth
          value={selectedQuality}
          onChange={(evt) => {
            setSelectedQuality(evt.target.value as string);
          }}
          clearable={false}
          text={intl.formatMessage(messages.selectQualityInfo)}
        />
        <Button
          fullWidth
          href={
            video.urls?.mp4[Number(selectedQuality) as videoSize] || undefined
          }
          aria-label={intl.formatMessage(messages.downloadButtonLabel)}
          disabled={isResolutionsEmpty}
          download
        >
          {intl.formatMessage(messages.downloadButtonLabel)}
        </Button>
      </Box>
    </FoldableItem>
  );
};
