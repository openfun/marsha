import { Nullable } from 'lib-common';
import { Box, BoxLoader, MarkdownDocument } from 'lib-components';
import React, { useEffect } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { LanguageSelector } from '@lib-markdown/components/LanguageSelector';
import { getMarkdownDocumentTranslatedContent } from '@lib-markdown/utils';

const messages = defineMessages({
  // Messages
  translationNotFound: {
    defaultMessage: 'Translation not found',
    description: 'Error message displayed when translation is not found',
    id: 'component.MarkdownEditor.translationNotFound',
  },
});

type MarkdownViewerProps = {
  markdownDocument: MarkdownDocument;
};

export const MarkdownViewer = ({ markdownDocument }: MarkdownViewerProps) => {
  const intl = useIntl();

  const [language, setLanguage] = React.useState(intl.locale);
  const [htmlContent, setHtmlContent] = React.useState<Nullable<string>>(null);

  useEffect(() => {
    let documentTranslatedContent = getMarkdownDocumentTranslatedContent(
      markdownDocument,
      'rendered_content',
      language,
      intl.formatMessage(messages.translationNotFound),
    );

    // Update image URL to use fresh signature
    markdownDocument.images.forEach((value) => {
      if (!value.url) {
        return;
      }
      const imageUrlRegex = new RegExp(
        'src="https?://[^"]+/' +
          markdownDocument.id +
          '/markdown-image/' +
          value.id +
          '/.*\\?(Policy|Signature|Key-Pair-Id)=[^"]+(Policy|Signature|Key-Pair-Id)=[^"]+(Signature|Key-Pair-Id)=[^"]+"',
        'g', // global
      );
      documentTranslatedContent = documentTranslatedContent.replace(
        imageUrlRegex,
        `src="${value.url}"`,
      );
    });

    setHtmlContent(documentTranslatedContent);
  }, [intl, language, markdownDocument]);

  const availableLanguages = markdownDocument.translations.map(
    (translation) => translation.language_code,
  );

  if (htmlContent === null) {
    return <BoxLoader />;
  }

  return (
    <Box pad="xsmall" style={{ minHeight: '20rem' }}>
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
