import { getIntl } from 'lib-common';
import { useEffect, useState } from 'react';
import { IntlShape } from 'react-intl';

import { useLanguageStore } from '../store/languageStore';
import { getCurrentTranslation } from '../utils';

export const useLanguage = () => {
  const [intl, setIntl] = useState<IntlShape>();
  const { language } = useLanguageStore((state) => {
    return {
      language: state.language,
    };
  });

  /**
   * Load the current language and translation
   */
  useEffect(() => {
    if (language) {
      getCurrentTranslation(language).then((translation) => {
        setIntl(
          getIntl({
            locale: language.replace('_', '-'),
            messages: translation,
          }),
        );
      });
    }
  }, [language]);

  return intl;
};
