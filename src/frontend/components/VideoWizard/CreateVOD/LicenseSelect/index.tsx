import { Select } from 'grommet';
import React, { useEffect, useMemo, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { useVideoMetadata } from 'data/queries';
import { LicenceChoise } from 'types/SelectOptions';

const messages = defineMessages({
  selectLicenseLabel: {
    defaultMessage:
      'Select the license under which you want to publish your video',
    description:
      'The label of the select used for choosing the license under which the instructor wants to publish your video',
    id: 'components.LicenseSelect.selectLicenseLabel',
  },
  noLicenseAvailableLabel: {
    defaultMessage: 'No license availables',
    description: 'The label displayed in the select when there is no license.',
    id: 'components.LicenseSelect.noLicenseAvailableLabel',
  },
});

interface LicenseSelectProps {
  disabled?: boolean;
  onChange: (selection: LicenceChoise) => void;
}

export const LicenseSelect = ({ disabled, onChange }: LicenseSelectProps) => {
  const intl = useIntl();

  const errorLicenseChoice = useMemo(
    () => ({
      label: intl.formatMessage(messages.noLicenseAvailableLabel),
      value: 'error',
    }),
    [intl, messages],
  );

  const { data } = useVideoMetadata(intl.locale);
  const choices = useMemo(
    () =>
      data?.actions.POST.license.choices?.map((choice) => ({
        label: choice.display_name,
        value: choice.value,
      })),
    [data],
  );
  const [selectedLicense, setSelectedLicense] = useState(
    choices?.length ? choices[0] : errorLicenseChoice,
  );

  useEffect(() => {
    onChange(selectedLicense);
  }, []);

  useEffect(() => {
    if (choices && choices.length && selectedLicense === errorLicenseChoice) {
      setSelectedLicense(choices[0]);
      onChange(choices[0]);
    }
  }, [choices, selectedLicense]);

  return (
    <Select
      aria-label={intl.formatMessage(messages.selectLicenseLabel)}
      disabled={disabled}
      labelKey="label"
      onChange={({ option }) => {
        setSelectedLicense(option);
        onChange(option);
      }}
      options={choices ?? [errorLicenseChoice]}
      replace={false}
      value={selectedLicense.value}
      valueKey={{ key: 'value', reduce: true }}
    />
  );
};
