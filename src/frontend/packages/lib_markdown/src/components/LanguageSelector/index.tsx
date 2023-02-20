import { Select } from 'grommet';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  selectLanguageLabel: {
    defaultMessage: 'Select language',
    description: 'Label for language selector',
    id: 'component.LanguageSelector.selectLanguageLabel',
  },
});

type LanguageSelectorProps = {
  currentLanguage: string;
  onLanguageChange: (selectedLanguage: string) => void;
  disabled: boolean;
  availableLanguages?: string[];
};

export const LanguageSelector = ({
  currentLanguage,
  onLanguageChange,
  disabled,
  availableLanguages,
}: LanguageSelectorProps) => {
  const intl = useIntl();
  let languageList = ['en', 'fr']; // may prefer an API call to fetch values
  if (availableLanguages) {
    languageList = languageList.filter((lang) =>
      availableLanguages.includes(lang),
    );
  }

  const displayedLanguage = intl.formatDisplayName(currentLanguage, {
    type: 'language',
  });
  return (
    <Select
      margin="xsmall"
      a11yTitle={intl.formatMessage(messages.selectLanguageLabel)}
      value={displayedLanguage}
      disabled={disabled}
      options={languageList.map((lang) => ({
        label: intl.formatDisplayName(lang, { type: 'language' }),
        value: lang,
      }))}
      onChange={({ option }: { option: { label: string; value: string } }) => {
        onLanguageChange(option.value);
      }}
    />
  );
};
