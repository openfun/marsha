import { Box, Card, CardBody, Grid, Text, Tip } from 'grommet';
import { DocumentMissing, DocumentVerified } from 'grommet-icons';
import { DocumentPerformance, Icon } from 'grommet-icons/icons';
import { Nullable } from 'lib-common';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { SelectContentTabProps } from 'components/SelectContent/SelectContentTabs';
import { buildContentItems } from 'components/SelectContent/utils';

import { MarkdownDocument, MarkdownDocumentTranslation } from 'lib-components';

const messages = defineMessages({
  loadingDocuments: {
    defaultMessage: 'Loading documents...',
    description:
      'Accessible message for the spinner while loading the markdown document in lti select view.',
    id: 'apps.markdown.SelectContent.loadingDocuments',
  },
  addDocument: {
    defaultMessage: 'Add a markdown document',
    description: `Text displayed on a button to add a new markdown document.`,
    id: 'apps.markdown.SelectContent.addDocument',
  },
  newDocument: {
    defaultMessage: 'New markdown document',
    description: `Default LTI consumer title for a new markdown document.`,
    id: 'apps.markdown.SelectContent.newDocument',
  },
  select: {
    defaultMessage: 'Select {title}',
    description: 'Accessible message for selecting a markdown document.',
    id: 'apps.markdown.SelectContent.select',
  },
  published: {
    defaultMessage: 'Published',
    description: 'Text helper displayed if a markdown document is published.',
    id: 'apps.markdown.SelectContent.published',
  },
  draft: {
    defaultMessage: 'Draft',
    description:
      'Text helper displayed if a markdown document is still a draft.',
    id: 'apps.markdown.SelectContent.draft',
  },
  missingTitle: {
    defaultMessage: 'Missing title',
    description:
      'Text helper displayed if a markdown document has no translated title.',
    id: 'apps.markdown.SelectContent.missingTitle',
  },
});

const IconStatus = ({
  message,
  GrommetIcon,
  color,
}: {
  message: string;
  GrommetIcon: Icon;
  color: string;
}) => (
  <Box direction="row" gap="small" pad="small">
    <GrommetIcon a11yTitle={message} color={color} />
    <Text>{message}</Text>
  </Box>
);

const AssertedIconStatus = ({
  assertion,
  trueMessage,
  falseMessage,
  TrueIcon,
  FalseIcon,
}: {
  assertion: boolean;
  trueMessage: string;
  falseMessage: string;
  TrueIcon: Icon;
  FalseIcon: Icon;
}) => {
  if (assertion) {
    return (
      <IconStatus
        message={trueMessage}
        GrommetIcon={TrueIcon}
        color="status-ok"
      />
    );
  }

  return (
    <IconStatus
      message={falseMessage}
      GrommetIcon={FalseIcon}
      color="status-error"
    />
  );
};

const getTranslatedContent = (
  markdownDocument: MarkdownDocument,
  content: keyof MarkdownDocumentTranslation,
  language: string,
  defaultValue: string,
) => {
  const translation = markdownDocument.translations.find(
    (value) => value.language_code === language,
  );
  return translation ? translation[content] : defaultValue;
};

const ContentCard = ({
  content,
  onClick,
  title,
}: {
  content: MarkdownDocument;
  onClick: () => void;
  title: string;
}) => {
  const intl = useIntl();

  return (
    <Tip
      content={
        <Box pad="medium">
          <Text>{title}</Text>
          <Box gap="small" direction="row" align="end">
            <AssertedIconStatus
              assertion={!content.is_draft}
              trueMessage={intl.formatMessage(messages.published)}
              falseMessage={intl.formatMessage(messages.draft)}
              TrueIcon={DocumentVerified}
              FalseIcon={DocumentMissing}
            />
          </Box>
        </Box>
      }
    >
      <Card
        width="large"
        title={intl.formatMessage(messages.select, {
          title,
        })}
        onClick={onClick}
      >
        <CardBody height="small" align="center" justify="center">
          <DocumentPerformance size="xlarge" />
        </CardBody>
      </Card>
    </Tip>
  );
};

interface SelectContentSectionProps {
  addAndSelectContent: () => void;
  newLtiUrl: string;
  items: Nullable<MarkdownDocument[]>;
  language: string;
  lti_select_form_data: SelectContentTabProps['lti_select_form_data'];
  setContentItemsValue: SelectContentTabProps['setContentItemsValue'];
}

export const SelectContentSection = ({
  addAndSelectContent,
  items,
  language,
  lti_select_form_data,
  setContentItemsValue,
}: SelectContentSectionProps) => {
  const intl = useIntl();

  return (
    <Box>
      <Grid columns="small" gap="small">
        <Card
          height="144px"
          justify="center"
          background="light-3"
          align="center"
          onClick={addAndSelectContent}
        >
          <Text alignSelf="center" textAlign="center">
            {intl.formatMessage(messages.addDocument)}
          </Text>
        </Card>

        {items?.map((item: MarkdownDocument) => {
          const title = getTranslatedContent(
            item,
            'title',
            language,
            intl.formatMessage(messages.missingTitle),
          );
          return (
            <ContentCard
              content={item!}
              key={item.id}
              onClick={() =>
                buildContentItems(
                  item!.lti_url!,
                  title,
                  null,
                  lti_select_form_data,
                  setContentItemsValue,
                )
              }
              title={title}
            />
          );
        })}
      </Grid>
    </Box>
  );
};
