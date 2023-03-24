import { Select } from 'grommet';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { useVideoMetadata } from '@lib-video/api/useVideoMetadata';
import { LicenseChoice } from '@lib-video/types/SelectOptions';

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
  onChange: (selection: LicenseChoice) => void;
}

export const LicenseSelect = ({ disabled, onChange }: LicenseSelectProps) => {
  const intl = useIntl();
  const hasRenderRef = useRef(false);

  const errorLicenseChoice = useMemo(
    () => ({
      label: intl.formatMessage(messages.noLicenseAvailableLabel),
      value: 'error',
    }),
    [intl],
  );

  const { data } = useVideoMetadata(intl.locale);
  const choices = useMemo(
    () =>
      data?.actions.POST.license.choices?.map((choice) => ({
        label: choice.display_name,
        value: choice.value,
      })),
    [data?.actions.POST.license.choices],
  );

  const [selectedLicense, setSelectedLicense] = useState(
    choices?.length ? choices[0] : errorLicenseChoice,
  );

  useEffect(() => {
    if (hasRenderRef.current) {
      return;
    }

    hasRenderRef.current = true;
    onChange(selectedLicense);
  }, [onChange, selectedLicense]);

  useEffect(() => {
    if (choices && choices.length && selectedLicense === errorLicenseChoice) {
      setSelectedLicense(choices[0]);
      onChange(choices[0]);
    }
  }, [choices, errorLicenseChoice, onChange, selectedLicense]);

  return (
    <Select
      aria-label={intl.formatMessage(messages.selectLicenseLabel)}
      id="select-license-id"
      name="license"
      disabled={disabled}
      labelKey="label"
      onChange={({ option }: { option: { label: string; value: string } }) => {
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
