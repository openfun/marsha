import { Select } from '@openfun/cunningham-react';
import { Maybe } from 'lib-common';
import {
  TimedTextTrackState,
  timedTextMode,
  useTimedTextTrack,
} from 'lib-components';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { LanguageChoice } from '@lib-video/types/SelectOptions';

const messages = defineMessages({
  selectLanguageLabel: {
    defaultMessage: 'Choose the language',
    description:
      'The label of the select used for choosing the language for which the user wants to upload a file.',
    id: 'components.LanguageSelect.selectLanguageLabel',
  },
  selectLanguageInfo: {
    defaultMessage:
      'The language for which you want to upload a timed text file',
    description:
      'The text under the select used for choosing the language for which the user wants to upload a file.',
    id: 'components.LanguageSelect.selectLanguageInfo',
  },
});

interface LanguageSelectProps {
  onChange: (selection?: LanguageChoice) => void;
  timedTextModeWidget: timedTextMode;
  choices?: LanguageChoice[];
}

export const LanguageSelect = ({
  onChange,
  timedTextModeWidget,
  choices,
}: LanguageSelectProps) => {
  const intl = useIntl();

  const timedTextTrackFn = useCallback(
    (state: TimedTextTrackState) => ({
      timedTextTracks: state.getTimedTextTracks(),
    }),
    [],
  );

  const { timedTextTracks } = useTimedTextTrack(timedTextTrackFn);

  const availableSelectableLanguages = useMemo(() => {
    const filteredTimedTextTracks = timedTextTracks.filter(
      (track) => track && track.mode === timedTextModeWidget,
    );
    const excludedLanguages = filteredTimedTextTracks.map(
      (track) => track.language,
    );

    return (
      choices
        ?.filter((lang) => !excludedLanguages.includes(lang.value))
        .sort((a, b) => a.label.localeCompare(b.label)) || []
    );
  }, [choices, timedTextTracks, timedTextModeWidget]);

  const [selectedLanguage, setSelectedLanguage] = useState<Maybe<string>>(
    availableSelectableLanguages?.[0]?.value,
  );

  useEffect(() => {
    const userLocalAvailableLanguage = availableSelectableLanguages?.find(
      (availableLanguage) => intl.locale.startsWith(availableLanguage.value),
    );

    setSelectedLanguage(userLocalAvailableLanguage?.value);
    onChange(userLocalAvailableLanguage);
  }, [intl.locale, availableSelectableLanguages, onChange]);

  return (
    <Select
      aria-label={intl.formatMessage(messages.selectLanguageLabel)}
      label={intl.formatMessage(messages.selectLanguageLabel)}
      options={availableSelectableLanguages}
      value={selectedLanguage}
      onChange={(evt) => {
        if (selectedLanguage === evt.target.value) {
          return;
        }

        const optionSelectedLanguage = availableSelectableLanguages?.find(
          (lang) => lang.value === evt.target.value,
        );

        setSelectedLanguage(optionSelectedLanguage?.value);
        onChange(optionSelectedLanguage);
      }}
      fullWidth
      clearable={false}
      text={intl.formatMessage(messages.selectLanguageInfo)}
    />
  );
};
