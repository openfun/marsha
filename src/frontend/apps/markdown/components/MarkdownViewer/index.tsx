import { Box } from 'grommet';
import React, { useEffect } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { Loader } from 'components/Loader';
import { Nullable } from 'utils/types';

import LanguageSelector from 'apps/markdown/components/LanguageSelector';
import { MarkdownAppData } from 'apps/markdown/data/MarkdownAppData';
import { getMarkdownDocumentTranslatedContent } from 'apps/markdown/utils/translations';

const messages = defineMessages({
  // Messages
  translationNotFound: {
    defaultMessage: 'Translation not found',
    description: 'Error message displayed when translation is not found',
    id: 'component.MarkdownEditor.translationNotFound',
  },
});

const MarkdownViewer = () => {
  const intl = useIntl();

  const markdownDocument = MarkdownAppData.markdownDocument;

  const [language, setLanguage] = React.useState(intl.locale);
  const [htmlContent, setHtmlContent] = React.useState<Nullable<string>>(null);

  useEffect(() => {
    setHtmlContent(
      getMarkdownDocumentTranslatedContent(
        markdownDocument,
        'rendered_content',
        language,
        intl.formatMessage(messages.translationNotFound),
      ),
    );
  }, [language]);

  const availableLanguages = markdownDocument.translations.map(
    (translation) => translation.language_code,
  );

  if (htmlContent === null) {
    return <Loader />;
  }

  return (
    <Box pad="xsmall" direction="column" style={{ minHeight: '20rem' }}>
      <Box
        pad="xsmall"
        style={{ position: 'absolute', top: 0, right: 0, zIndex: 10 }}
      >
        {availableLanguages.length > 1 ||
        !availableLanguages.includes(language) ? (
          <LanguageSelector
            currentLanguage={language}
            onLanguageChange={setLanguage}
            disabled={false}
            availableLanguages={availableLanguages}
          />
        ) : null}
      </Box>
      <div // div required as grommet.Box does not allow dangerouslySetInnerHTML
        // markdown-body required for github-markdown-css/github-markdown.css
        className="markdown-body"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </Box>
  );
};

export default MarkdownViewer;
