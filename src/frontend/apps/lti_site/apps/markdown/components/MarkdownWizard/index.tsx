import { Button, Input } from '@openfun/cunningham-react';
import { Breakpoints } from 'lib-common';
import {
  Box,
  Text,
  WhiteCard,
  WizardLayout,
  useResponsive,
} from 'lib-components';
import {
  LanguageSelector,
  MARKDOWN_EDITOR_ROUTE,
  useSaveTranslations,
} from 'lib-markdown';
import React from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';

const messages = defineMessages({
  markdownCreationTitle: {
    defaultMessage: 'Start by naming your course',
    description: 'Title of the markdown wizard.',
    id: 'component.MarkdownWizard.markdownCreationTitle',
  },
  descriptionText: {
    defaultMessage:
      'Use this wizard to create a new Markdown course, that you will be able to share with your students.',
    description: 'Description of the markdown wizard.',
    id: 'component.MarkdownWizard.descriptionText',
  },
  placeholderTitleInput: {
    defaultMessage: 'Enter title of your course here',
    description: 'A placeholder text inviting to enter a markdown title.',
    id: 'components.MarkdownWizard.placeholderTitleInput',
  },
  createMarkdownButtonLabel: {
    defaultMessage: 'Create your course',
    description:
      "Button's label offering the user to validate his form and create a new markdown.",
    id: 'components.MarkdownWizard.createMarkdownButtonLabel',
  },
  updateMarkdownInfosFail: {
    defaultMessage: 'Course update has failed !',
    description: 'Message displayed when markdown infos update has failed.',
    id: 'component.MarkdownWizard.updateMarkdownInfosFail',
  },
  saveFailure: {
    defaultMessage: 'An error occurred, the document is not saved',
    description:
      'Displayed message in toast when the markdown document saving request failed',
    id: 'component.MarkdownWizard.saveFailure',
  },
});

type MarkdownWizardProps = {
  markdownDocumentId: string;
};

export const MarkdownWizard = ({ markdownDocumentId }: MarkdownWizardProps) => {
  const intl = useIntl();
  const { isSmallerBreakpoint, breakpoint } = useResponsive();
  const navigate = useNavigate();

  const [language, setLanguage] = React.useState(intl.locale);
  const [localTitle, setLocalTitle] = React.useState('');

  const { mutate: saveDocumentTranslations } = useSaveTranslations(
    markdownDocumentId,
    {
      onSuccess: () => {
        navigate(MARKDOWN_EDITOR_ROUTE());
      },
      onError: () => {
        toast.error(intl.formatMessage(messages.saveFailure));
      },
    },
  );

  return (
    <WizardLayout>
      <WhiteCard title={intl.formatMessage(messages.markdownCreationTitle)}>
        <Box
          gap="medium"
          margin={{
            horizontal: isSmallerBreakpoint(breakpoint, Breakpoints.large)
              ? 'medium'
              : 'xlarge',
          }}
        >
          <Text className="mb-t" textAlign="center">
            {intl.formatMessage(messages.descriptionText)}
          </Text>

          <Box direction="row" width="100%" pad={{ bottom: 'xsmall' }}>
            <Input
              aria-label={intl.formatMessage(messages.placeholderTitleInput)}
              label={intl.formatMessage(messages.placeholderTitleInput)}
              maxLength={255}
              onChange={(event) => setLocalTitle(event.target.value)}
              value={localTitle}
              fullWidth
            />
          </Box>
          <LanguageSelector
            currentLanguage={language}
            onLanguageChange={setLanguage}
            disabled={false}
            fullWidth
          />

          <Button
            fullWidth
            aria-label={intl.formatMessage(messages.createMarkdownButtonLabel)}
            disabled={!localTitle}
            onClick={() => {
              saveDocumentTranslations({
                language_code: language,
                title: localTitle,
                content: '',
                rendered_content: '',
              });
            }}
            title={intl.formatMessage(messages.createMarkdownButtonLabel)}
          >
            {intl.formatMessage(messages.createMarkdownButtonLabel)}
          </Button>
        </Box>
      </WhiteCard>
    </WizardLayout>
  );
};
