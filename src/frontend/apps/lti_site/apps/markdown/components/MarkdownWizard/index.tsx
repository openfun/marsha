import React, { useContext } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';

import { WhiteCard, WizardLayout } from 'lib-components';
import { Box, Button, ResponsiveContext, Text, TextInput } from 'grommet';
import {
  LanguageSelector,
  MARKDOWN_EDITOR_ROUTE,
  useSaveTranslations,
} from 'lib-markdown';
import { toast } from 'react-hot-toast';

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
  const size = useContext(ResponsiveContext);
  const history = useHistory();

  const [language, setLanguage] = React.useState(intl.locale);
  const [localTitle, setLocalTitle] = React.useState('');

  const { mutate: saveDocumentTranslations } = useSaveTranslations(
    markdownDocumentId,
    {
      onSuccess: () => {
        history.push(MARKDOWN_EDITOR_ROUTE());
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
          direction="column"
          gap="medium"
          margin={{ horizontal: size === 'medium' ? 'medium' : 'xlarge' }}
        >
          <Text
            color="blue-active"
            margin={{ bottom: 'small' }}
            size="1rem"
            textAlign="center"
          >
            {intl.formatMessage(messages.descriptionText)}
          </Text>

          <Box direction="row" width="100%" pad={{ bottom: 'xsmall' }}>
            <TextInput
              a11yTitle={intl.formatMessage(messages.placeholderTitleInput)}
              placeholder={intl.formatMessage(messages.placeholderTitleInput)}
              value={localTitle}
              onChange={(event) => setLocalTitle(event.target.value)}
              // This is enforced by backend, but simpler to not allow user for too long title
              maxLength={255}
            />
          </Box>
          <LanguageSelector
            currentLanguage={language}
            onLanguageChange={setLanguage}
            disabled={false}
          />

          <Button
            a11yTitle={intl.formatMessage(messages.createMarkdownButtonLabel)}
            disabled={!localTitle}
            label={intl.formatMessage(messages.createMarkdownButtonLabel)}
            onClick={() => {
              saveDocumentTranslations({
                language_code: language,
                title: localTitle,
                content: '',
                rendered_content: '',
              });
            }}
            primary
            style={{ minHeight: '50px', fontFamily: 'Roboto-Medium' }}
            title={intl.formatMessage(messages.createMarkdownButtonLabel)}
          />
        </Box>
      </WhiteCard>
    </WizardLayout>
  );
};
