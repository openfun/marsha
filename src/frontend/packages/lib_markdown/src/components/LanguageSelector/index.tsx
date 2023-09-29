import { Select } from '@openfun/cunningham-react';
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
  fullWidth?: boolean;
};

export const LanguageSelector = ({
  currentLanguage,
  onLanguageChange,
  disabled,
  availableLanguages,
  fullWidth,
}: LanguageSelectorProps) => {
  const intl = useIntl();
  let languageList = ['en', 'fr']; // may prefer an API call to fetch values
  if (availableLanguages) {
    languageList = languageList.filter((lang) =>
      availableLanguages.includes(lang),
    );
  }

  return (
    <Select
      aria-label={intl.formatMessage(messages.selectLanguageLabel)}
      label={intl.formatMessage(messages.selectLanguageLabel)}
      options={languageList.map((lang) => ({
        label: intl.formatDisplayName(lang, { type: 'language' }) as string,
        value: lang,
      }))}
      fullWidth={fullWidth}
      value={currentLanguage}
      onChange={(evt) => {
        onLanguageChange(evt.target.value as string);
      }}
      clearable={false}
      disabled={disabled}
    />
  );
};
