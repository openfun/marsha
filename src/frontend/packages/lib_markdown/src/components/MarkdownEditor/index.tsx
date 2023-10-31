import { Button, Input } from '@openfun/cunningham-react';
import { useQueryClient } from '@tanstack/react-query';
import { Anchor, Footer } from 'grommet';
import { Nullable, colorsTokens } from 'lib-common';
import {
  Box,
  BoxLoader,
  MarkdownDocumentRenderingOptions,
  Text,
} from 'lib-components';
import React, { Suspense, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import {
  CodeMirrorEditor,
  useCodemirrorEditor,
} from '@lib-markdown/components/CodeMirrorEditor';
import { LanguageSelector } from '@lib-markdown/components/LanguageSelector';
import { MarkdownImageDropzone } from '@lib-markdown/components/MarkdownImageDropzone';
import { MdxRenderer } from '@lib-markdown/components/MdxRenderer';
import { MdxRenderingOptionsSelector } from '@lib-markdown/components/MdxRenderingOptionsSelector';
import {
  ScreenDisposition,
  ScreenDispositionSelector,
} from '@lib-markdown/components/ScreenDispositionSelector';
import { useImageUploadManager } from '@lib-markdown/components/useImageUploadManager';
import {
  useMarkdownDocument,
  useSaveTranslations,
  useUpdateMarkdownDocument,
} from '@lib-markdown/data';
import {
  escapeMarkdown,
  getMarkdownDocumentTranslatedContent,
} from '@lib-markdown/utils';

const messages = defineMessages({
  // Inputs
  title: {
    defaultMessage: 'Title',
    description: "Label for markdown document's title",
    id: 'component.MarkdownEditor.title',
  },
  // Buttons
  publish: {
    defaultMessage: 'Publish',
    description:
      'Button to mark edited markdown document as published (not draft)',
    id: 'component.MarkdownEditor.publish',
  },
  save: {
    defaultMessage: 'Save',
    description: 'Button to save edited markdown document',
    id: 'component.MarkdownEditor.save',
  },
  // Messages
  saveSuccess: {
    defaultMessage: 'Document is saved',
    description:
      'Displayed message in toast when the markdown document is successfully saved',
    id: 'component.MarkdownEditor.saveSuccess',
  },
  saveFailure: {
    defaultMessage: 'An error occurred, the document is not saved',
    description:
      'Displayed message in toast when the markdown document saving request failed',
    id: 'component.MarkdownEditor.saveFailure',
  },
  // Displayed text
  editorEmptyDragDropHelper: {
    defaultMessage:
      "💡 You can easily add some content by drag and dropping a text file in one of the editor's line.",
    description: 'Displayed help text when editor is empty',
    id: 'component.MarkdownEditor.editorEmptyDragDropHelper',
  },
});

type MarkdownEditorProps = {
  markdownDocumentId: string;
};

export const MarkdownEditor = ({ markdownDocumentId }: MarkdownEditorProps) => {
  const intl = useIntl();

  const [language, setLanguage] = React.useState(intl.locale);

  // Store local values
  const [localMarkdownContent, setLocalMarkdownContent] = React.useState('');
  const [localTitle, setLocalTitle] = React.useState('');
  const [localIsDraft, setLocalIsDraft] = React.useState(true);
  const [localRenderedContent, setLocalRenderedContent] =
    React.useState<Nullable<string>>(null);
  const [localRenderingOptions, setLocalRenderingOptions] =
    React.useState<MarkdownDocumentRenderingOptions>({});

  // Store initial values
  const [initialMarkdownContent, setInitialMarkdownContent] =
    React.useState('');
  const [initialTitle, setInitialTitle] = React.useState('');
  const [initialRenderedContent, setInitialRenderedContent] =
    React.useState('');
  const [initialRenderingOptions, setInitialRenderingOptions] =
    React.useState<MarkdownDocumentRenderingOptions>({});

  const [screenDisposition, setScreenDisposition] = React.useState(
    ScreenDisposition.editor,
  );

  const contentChanged = React.useRef(false);

  const {
    codemirrorEditor,
    insertText,
    replaceEditorWholeContent,
    replaceOnceInDocument,
  } = useCodemirrorEditor();

  const onImageUploadFinished = (imageId: string, imageFileName: string) => {
    // Called once the image has been uploaded *and* processed
    replaceOnceInDocument(
      `\\[//\\]: # \\(${imageId}\\)`,
      `![${escapeMarkdown(imageFileName)}](/uploaded/image/${imageId})`,
    );
  };

  const { addImageUpload } = useImageUploadManager(
    markdownDocumentId,
    onImageUploadFinished,
  );

  // note: we don't want to fetch the markdown document regularly to prevent
  // any editor update while the user has not saved her document.
  const queryClient = useQueryClient();
  const { data: markdownDocument } = useMarkdownDocument(markdownDocumentId, {
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });
  const { mutate: mutateDocument } =
    useUpdateMarkdownDocument(markdownDocumentId);

  const { mutate: saveDocumentTranslations, isLoading: isSaving } =
    useSaveTranslations(markdownDocumentId, {
      onSuccess: () => {
        toast.success(intl.formatMessage(messages.saveSuccess));
      },
      onError: () => {
        toast.error(intl.formatMessage(messages.saveFailure));
      },
    });

  const language_code = markdownDocument?.translations[0]?.language_code;
  useEffect(() => {
    if (language_code) {
      setLanguage(language_code);
    }
  }, [language_code]);

  // Allow data reloading from backend on language change
  useEffect(() => {
    queryClient.invalidateQueries(['markdown-documents', markdownDocumentId]);
  }, [markdownDocumentId, queryClient, language]);

  // Initialization hook
  useEffect(() => {
    if (!markdownDocument) {
      return;
    }
    const translatedTitle = getMarkdownDocumentTranslatedContent(
      markdownDocument,
      'title',
      language,
    );
    setLocalTitle(translatedTitle);
    setInitialTitle(translatedTitle);

    const translatedContent = getMarkdownDocumentTranslatedContent(
      markdownDocument,
      'content',
      language,
    );
    setInitialMarkdownContent(translatedContent);
    setLocalMarkdownContent(translatedContent);
    replaceEditorWholeContent(translatedContent);

    const translatedRenderedContent = getMarkdownDocumentTranslatedContent(
      markdownDocument,
      'rendered_content',
      language,
    );
    setLocalRenderedContent(translatedRenderedContent);
    setInitialRenderedContent(translatedRenderedContent);

    setLocalRenderingOptions(markdownDocument.rendering_options);
    setInitialRenderingOptions(markdownDocument.rendering_options);
    setLocalIsDraft(markdownDocument.is_draft);
  }, [language, markdownDocument, replaceEditorWholeContent]);

  // Only change detection here
  contentChanged.current =
    localTitle !== initialTitle ||
    localMarkdownContent !== initialMarkdownContent ||
    localRenderedContent !== initialRenderedContent ||
    localRenderingOptions !== initialRenderingOptions;

  // Detect change to alert user before leaving
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (contentChanged.current) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, []); // We highly rely on any change performed

  // Helpers
  const canSaveDocument = () =>
    !!localMarkdownContent && !!localRenderedContent && !!localTitle;

  const saveDocument = () => {
    if (canSaveDocument()) {
      saveDocumentTranslations({
        language_code: language,
        title: localTitle,
        content: localMarkdownContent,
        rendered_content: localRenderedContent || undefined,
      });
      if (localRenderingOptions !== initialRenderingOptions) {
        mutateDocument({
          rendering_options: localRenderingOptions,
        });
      }
    }
  };

  const publishDocument = () => {
    mutateDocument({
      is_draft: false,
    });
    // This will invalidate query cache, and refetch all data
  };

  const onDropAccepted = (files: File[]) => {
    files.forEach((file) => {
      addImageUpload(file).then((markdownImageId) => {
        insertText(`[//]: # (${markdownImageId})\n`);
      });
    });
  };

  // Don't try to load components while the document has not been fetched
  if (!markdownDocument) {
    return <BoxLoader />;
  }

  return (
    <Box pad="xsmall">
      <Suspense fallback={<BoxLoader />}>
        {isSaving && <BoxLoader />}

        <Box>
          <Box
            direction="row"
            width="full"
            pad={{ bottom: 'xsmall' }}
            align="center"
            gap="small"
          >
            <Input
              aria-label={intl.formatMessage(messages.title)}
              label={intl.formatMessage(messages.title)}
              fullWidth
              onChange={(event) => setLocalTitle(event.target.value)}
              value={localTitle}
              maxLength={255}
            />

            <Box direction="row">
              <MdxRenderingOptionsSelector
                renderingOptions={localRenderingOptions}
                setRenderingOptions={setLocalRenderingOptions}
              />
              <Box direction="row" gap="small">
                <Button
                  onClick={() => publishDocument()}
                  disabled={
                    !canSaveDocument() ||
                    contentChanged.current ||
                    !localIsDraft
                  }
                >
                  {intl.formatMessage(messages.publish)}
                </Button>

                <Button
                  onClick={() => saveDocument()}
                  disabled={!canSaveDocument() || !contentChanged.current}
                >
                  {intl.formatMessage(messages.save)}
                </Button>
              </Box>
            </Box>
          </Box>

          <Box direction="row" align="center" justify="space-between">
            <ScreenDispositionSelector
              screenDisposition={screenDisposition}
              setScreenDisposition={setScreenDisposition}
            />
            <Box margin="xsmall" align="end">
              <LanguageSelector
                currentLanguage={language}
                onLanguageChange={setLanguage}
                disabled={contentChanged.current}
              />
            </Box>
          </Box>
        </Box>

        <Box
          direction="row"
          height={{ min: '50vw' }}
          style={{
            borderTop: `1px solid ${colorsTokens['greyscale-500']}`,
          }}
        >
          <Box
            fill="horizontal"
            // Use style to hide to keep the component's state
            style={{
              display:
                screenDisposition === ScreenDisposition.editor
                  ? 'inherit'
                  : 'none',
            }}
            data-testid="editor_container"
          >
            {localMarkdownContent !== null ? (
              <Box justify="space-between" fill>
                <MarkdownImageDropzone onDropAccepted={onDropAccepted}>
                  <CodeMirrorEditor
                    onEditorContentChange={setLocalMarkdownContent}
                    initialContent={localMarkdownContent}
                    codemirrorEditor={codemirrorEditor}
                  />
                </MarkdownImageDropzone>
                <Box>
                  <Footer background="brand" pad="xxsmall">
                    <Text color="white">
                      {intl.formatMessage(messages.editorEmptyDragDropHelper)}
                    </Text>
                  </Footer>
                  <Footer background="light-1" pad="xxsmall">
                    <Anchor
                      href="https://www.markdownguide.org/basic-syntax"
                      target="_blank"
                      rel="noopener noreferrer"
                      label="Markdown basic syntax"
                      color="dark-3"
                      weight="normal"
                    />
                  </Footer>
                </Box>
              </Box>
            ) : (
              <BoxLoader />
            )}
          </Box>
          <Box
            fill="horizontal"
            pad={{ left: 'xsmall' }}
            // Use style to hide to keep the component's state
            style={{
              display:
                screenDisposition === ScreenDisposition.rendering
                  ? 'inherit'
                  : 'none',
            }}
            data-testid="renderer_container"
          >
            <MdxRenderer
              markdownText={localMarkdownContent}
              markdownDocumentId={markdownDocumentId}
              onRenderedContentChange={setLocalRenderedContent}
              renderingOptions={localRenderingOptions}
              mardownImages={markdownDocument.images}
            />
          </Box>
        </Box>
      </Suspense>
    </Box>
  );
};
