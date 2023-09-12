import { Select } from '@openfun/cunningham-react';
import { CenterLoader, FoldableItem } from 'lib-components';
import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { useUpdateVideo } from '@lib-video/api/useUpdateVideo';
import { useVideoMetadata } from '@lib-video/api/useVideoMetadata';
import { useCurrentVideo } from '@lib-video/hooks/useCurrentVideo';

const messages = defineMessages({
  info: {
    defaultMessage:
      'This widget allows you to manage the license of the video.',
    description: 'Info of the widget used for managing the license.',
    id: 'components.LicenseManager.info',
  },
  title: {
    defaultMessage: 'License',
    description: 'Title of the widget used to manage the license of the video.',
    id: 'components.LicenseManager.title',
  },
  updateVideoSucces: {
    defaultMessage: 'Video updated.',
    description: 'Message displayed when video is successfully updated.',
    id: 'component.LicenseManager.updateVideoSuccess',
  },
  updateVideoFail: {
    defaultMessage: 'Video update has failed!',
    description: 'Message displayed when video update has failed.',
    id: 'component.LicenseManager.updateVideoFail',
  },
  noLicenseAvailableLabel: {
    defaultMessage: 'No license available',
    description: 'The label displayed in the select when there is no license.',
    id: 'components.LicenseManager.noLicenseAvailableLabel',
  },
  selectLicenseLabel: {
    defaultMessage: 'Select the license',
    description:
      'The label of the select used for choosing the license under which the instructor wants to publish your video',
    id: 'components.LicenseManager.selectLicenseLabel',
  },
  selectLicenseInfo: {
    defaultMessage:
      'Select the license under which you want to publish your video',
    description:
      'The text under the select used for choosing the license under which the instructor wants to publish your video',
    id: 'components.LicenseManager.selectLicenseInfo',
  },
});

export const LicenseManager = () => {
  const intl = useIntl();
  const video = useCurrentVideo();
  const { data, isLoading } = useVideoMetadata(intl.locale);
  const choices = useMemo(() => {
    return data?.actions.POST.license.choices?.map((choice) => ({
      label: choice.display_name,
      value: choice.value,
    }));
  }, [data?.actions.POST.license.choices]);

  const [selectedLicense, setSelectedLicense] = useState(
    video.license || undefined,
  );

  useEffect(() => {
    if (isLoading) {
      return;
    }

    return setSelectedLicense(
      choices?.find((choice) => choice.value === video.license)?.value,
    );
  }, [choices, isLoading, video.license]);

  const errorLicenseChoice = {
    label: intl.formatMessage(messages.noLicenseAvailableLabel),
    value: 'error',
  };

  const videoMutation = useUpdateVideo(video.id, {
    onSuccess: () => {
      toast.success(intl.formatMessage(messages.updateVideoSucces), {
        position: 'bottom-center',
      });
    },
    onError: () => {
      toast.error(intl.formatMessage(messages.updateVideoFail), {
        position: 'bottom-center',
      });
    },
  });

  return (
    <FoldableItem
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue={true}
      title={intl.formatMessage(messages.title)}
    >
      {!isLoading ? (
        <Select
          aria-label={intl.formatMessage(messages.selectLicenseLabel)}
          label={intl.formatMessage(messages.selectLicenseLabel)}
          options={choices ?? [errorLicenseChoice]}
          value={selectedLicense}
          onChange={(evt) => {
            if (selectedLicense === evt.target.value) {
              return;
            }

            setSelectedLicense(evt.target.value as string);

            if (evt.target.value !== errorLicenseChoice.value) {
              videoMutation.mutate({ license: evt.target.value as string });
            }
          }}
          fullWidth
          clearable={false}
          text={intl.formatMessage(messages.selectLicenseInfo)}
        />
      ) : (
        <CenterLoader />
      )}
    </FoldableItem>
  );
};
