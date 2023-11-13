import { Button } from '@openfun/cunningham-react';
import { Grid } from 'grommet';
import { DocumentText } from 'grommet-icons';
import { Nullable } from 'lib-common';
import {
  Box,
  ContentCard,
  MarkdownDocument,
  MarkdownDocumentTranslation,
} from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { SelectContentTabProps } from 'components/SelectContent/SelectContentTabs';
import { buildContentItems } from 'components/SelectContent/utils';

const messages = defineMessages({
  addDocument: {
    defaultMessage: 'Add a markdown document',
    description: `Text displayed on a button to add a new markdown document.`,
    id: 'apps.markdown.SelectContent.addDocument',
  },
  select: {
    defaultMessage: 'Select {title}',
    description: 'Accessible message for selecting a markdown document.',
    id: 'apps.markdown.SelectContent.select',
  },
  missingTitle: {
    defaultMessage: 'Missing title',
    description:
      'Text helper displayed if a markdown document has no translated title.',
    id: 'apps.markdown.SelectContent.missingTitle',
  },
});

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

const SelectContentCard = ({
  onClick,
  title,
}: {
  onClick: () => void;
  title: string;
}) => {
  const intl = useIntl();

  return (
    <ContentCard
      aria-label={intl.formatMessage(messages.select, { title })}
      onClick={onClick}
      header={
        <Box
          aria-label="thumbnail"
          role="img"
          width="100%"
          height="150px"
          align="center"
          justify="center"
          background="radial-gradient(ellipse at center, #45a3ff 0%,#2169ff 100%)"
        >
          <DocumentText size="large" color="white" />
        </Box>
      }
      title={title || ''}
    />
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
      <Box margin={{ vertical: 'medium' }}>
        <Button
          icon={<span className="material-icons">add_circle</span>}
          onClick={addAndSelectContent}
          style={{ alignSelf: 'start' }}
        >
          {intl.formatMessage(messages.addDocument)}
        </Button>
      </Box>
      <Grid columns="small" gap="small">
        {items?.map((item: MarkdownDocument) => {
          const title = getTranslatedContent(
            item,
            'title',
            language,
            intl.formatMessage(messages.missingTitle),
          );
          return (
            <SelectContentCard
              key={item.id}
              onClick={() =>
                buildContentItems(
                  item.lti_url,
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
