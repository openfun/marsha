import { Select } from 'grommet';
import { Nullable } from 'lib-common';
import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';
import { LicenseChoice } from 'types';

import { useUpdateVideo } from 'api/useUpdateVideo';
import { useVideoMetadata } from 'api/useVideoMetadata';
import { useCurrentVideo } from 'hooks/useCurrentVideo';

import { FoldableItem } from '../../FoldableItem';

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
    defaultMessage: 'Video update has failed !',
    description: 'Message displayed when video update has failed.',
    id: 'component.LicenseManager.updateVideoFail',
  },
  noLicenseAvailableLabel: {
    defaultMessage: 'No license available',
    description: 'The label displayed in the select when there is no license.',
    id: 'components.LicenseManager.noLicenseAvailableLabel',
  },
  selectLicenseLabel: {
    defaultMessage:
      'Select the license under which you want to publish your video',
    description:
      'The label of the select used for choosing the license under which the instructor wants to publish your video',
    id: 'components.LicenseManager.selectLicenseLabel',
  },
});

export const LicenseManager = () => {
  const intl = useIntl();
  const video = useCurrentVideo();
  const { data } = useVideoMetadata(intl.locale);
  const choices = useMemo(() => {
    return data?.actions.POST.license.choices?.map((choice) => ({
      label: choice.display_name,
      value: choice.value,
    }));
  }, [data?.actions.POST.license.choices]);

  const [selectedLicense, setSelectedLicense] = useState<
    Nullable<LicenseChoice>
  >(video.license ? { label: video.license, value: video.license } : null);

  useEffect(() => {
    return setSelectedLicense(
      choices?.find((choice) => choice.label === video.license) || null,
    );
  }, [choices, video.license]);

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

  function onChange(option: LicenseChoice) {
    videoMutation.mutate({ license: option.value });
    setSelectedLicense(option);
  }

  return (
    <FoldableItem
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue={true}
      title={intl.formatMessage(messages.title)}
    >
      <Select
        aria-label={intl.formatMessage(messages.selectLicenseLabel)}
        id="select-license-id"
        name="license"
        labelKey="label"
        onChange={onChange}
        options={choices ?? [errorLicenseChoice]}
        replace={false}
        value={selectedLicense?.value}
        valueKey={{ key: 'value', reduce: true }}
      />
    </FoldableItem>
  );
};
