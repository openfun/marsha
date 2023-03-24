import { useTimedTextTrack, timedTextMode, Select } from 'lib-components';
import React, { useEffect, useMemo, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { useFetchTimedTextTrackLanguageChoices } from '@lib-video/api/useFetchTimedTextTrackLanguageChoices';
import { LanguageChoice } from '@lib-video/types/SelectOptions';

const messages = defineMessages({
  selectLanguageLabel: {
    defaultMessage:
      'Select the language for which you want to upload a timed text file',
    description:
      'The label of the select used for choosing the language for which the user wants to upload a file.',
    id: 'components.LanguageSelect.selectLanguageLabel',
  },
  noLanguageAvailableLabel: {
    defaultMessage: 'No language availables',
    description:
      'The label displayed in the select when there is no available language.',
    id: 'components.LanguageSelect.noLanguageAvailableLabel',
  },
});

interface LanguageSelectProps {
  onChange: (selection: LanguageChoice) => void;
  timedTextModeWidget: timedTextMode;
}

export const LanguageSelect = ({
  onChange,
  timedTextModeWidget,
}: LanguageSelectProps) => {
  const intl = useIntl();

  const errorLanguageChoice = useMemo(
    () => ({
      label: intl.formatMessage(messages.noLanguageAvailableLabel),
      value: 'error',
    }),
    [intl],
  );

  const { data } = useFetchTimedTextTrackLanguageChoices();
  const choices = useMemo(
    () =>
      data?.actions.POST.language.choices?.map((choice) => ({
        label: choice.display_name,
        value: choice.value,
      })),
    [data?.actions.POST.language.choices],
  );

  const { timedTextTracks } = useTimedTextTrack((state) => ({
    timedTextTracks: state.getTimedTextTracks(),
  }));

  const availableSelectableLanguages = useMemo(() => {
    const filteredTimedTextTracks = timedTextTracks.filter(
      (track) => track && track.mode === timedTextModeWidget,
    );
    const excludedLanguages = filteredTimedTextTracks.map(
      (track) => track.language,
    );

    return (
      choices &&
      choices
        .filter((lang) => !excludedLanguages.includes(lang.value))
        .sort((a, b) => a.label.localeCompare(b.label))
    );
  }, [choices, timedTextTracks, timedTextModeWidget]);

  const userLocalAvailableLanguage = useMemo(() => {
    const userLocalLanguage = intl.locale;

    return availableSelectableLanguages
      ? availableSelectableLanguages.find((availableLanguage) =>
          userLocalLanguage.startsWith(availableLanguage.value),
        )
      : errorLanguageChoice;
  }, [availableSelectableLanguages, intl, errorLanguageChoice]);

  const [selectedLanguage, setSelectedLanguage] = useState<{
    label: string;
    value: string;
  }>(
    userLocalAvailableLanguage ??
      (availableSelectableLanguages
        ? availableSelectableLanguages[0]
        : errorLanguageChoice),
  );

  useEffect(() => {
    onChange(selectedLanguage);
  }, [onChange, selectedLanguage]);

  if (
    availableSelectableLanguages &&
    availableSelectableLanguages.length > 0 &&
    !availableSelectableLanguages.includes(selectedLanguage)
  ) {
    setSelectedLanguage(
      userLocalAvailableLanguage ?? availableSelectableLanguages[0],
    );
  }

  return (
    <Select
      aria-label={intl.formatMessage(messages.selectLanguageLabel)}
      options={availableSelectableLanguages ?? [errorLanguageChoice]}
      replace={false}
      labelKey="label"
      value={selectedLanguage.value}
      valueKey={{ key: 'value', reduce: true }}
      onChange={({ option }: { option: { label: string; value: string } }) => {
        setSelectedLanguage(option);
      }}
    />
  );
};
