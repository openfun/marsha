import { Select } from '@openfun/cunningham-react';
import { BoxError, BoxLoader } from 'lib-components';
import React, { useEffect, useMemo, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { useVideoMetadata } from '@lib-video/api/useVideoMetadata';
import { LicenseChoice } from '@lib-video/types/SelectOptions';

const messages = defineMessages({
  selectLicenseLabel: {
    defaultMessage: 'Select the license',
    description:
      'The label of the select used for choosing the license under which the instructor wants to publish your video',
    id: 'components.LicenseSelect.selectLicenseLabel',
  },
  selectLicenseInfo: {
    defaultMessage:
      'Select the license under which you want to publish your video',
    description:
      'The info under the select used for choosing the license under which the instructor wants to publish your video',
    id: 'components.LicenseSelect.selectLicenseInfo',
  },
  errorLoading: {
    defaultMessage:
      'Something went wrong when loading the licenses, refresh the page or try again later.',
    description:
      'The message displayed when there is a problem when loading the licences.',
    id: 'components.LicenseSelect.errorLoading',
  },
});

interface LicenseSelectProps {
  disabled?: boolean;
  onChange: (selection: LicenseChoice) => void;
}

export const LicenseSelect = ({ disabled, onChange }: LicenseSelectProps) => {
  const intl = useIntl();
  const { data, error } = useVideoMetadata(intl.locale);
  const choices = useMemo(
    () =>
      data?.actions.POST.license.choices?.map((choice) => ({
        label: choice.display_name,
        value: choice.value,
      })),
    [data?.actions.POST.license.choices],
  );

  const [selectedLicense, setSelectedLicense] = useState(
    choices?.length ? choices[0] : undefined,
  );

  useEffect(() => {
    if (choices?.length && !selectedLicense) {
      setSelectedLicense(choices[0]);
      onChange(choices[0]);
    }
  }, [choices, onChange, selectedLicense]);

  if (error) {
    return <BoxError message={intl.formatMessage(messages.errorLoading)} />;
  }

  if (!choices) {
    return <BoxLoader />;
  }

  return (
    <Select
      aria-label={intl.formatMessage(messages.selectLicenseLabel)}
      label={intl.formatMessage(messages.selectLicenseLabel)}
      options={choices}
      fullWidth
      value={selectedLicense?.value}
      onChange={(evt) => {
        const choice = choices?.find(
          (option) => option.value === evt.target.value,
        );

        if (!choice) {
          return;
        }

        setSelectedLicense(choice);
        onChange(choice);
      }}
      clearable={false}
      disabled={disabled}
      text={intl.formatMessage(messages.selectLicenseInfo)}
    />
  );
};
