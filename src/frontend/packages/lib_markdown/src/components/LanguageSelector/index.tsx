import { Anchor, Box, DropButton } from 'grommet';
import React from 'react';
import { useIntl } from 'react-intl';

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
    <DropButton
      margin="xsmall"
      a11yTitle={displayedLanguage}
      label={displayedLanguage}
      disabled={disabled}
      dropAlign={{ top: 'bottom', left: 'left' }}
      dropContent={
        <Box>
          {languageList
            .filter((lang) => lang !== currentLanguage)
            .map((lang) => {
              const displayLanguage = intl.formatDisplayName(lang, {
                type: 'language',
              });
              return (
                <Anchor
                  key={displayLanguage}
                  a11yTitle={displayLanguage}
                  label={displayLanguage}
                  onClick={() => {
                    onLanguageChange(lang);
                  }}
                  margin="xxsmall"
                  style={{ textTransform: 'capitalize' }}
                />
              );
            })}
        </Box>
      }
      style={{ textTransform: 'capitalize' }}
    />
  );
};
