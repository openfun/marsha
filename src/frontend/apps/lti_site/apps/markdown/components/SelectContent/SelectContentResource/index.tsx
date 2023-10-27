import { Box, Heading } from 'lib-components';
import { useCreateMarkdownDocument } from 'lib-markdown';
import React from 'react';
import { useIntl } from 'react-intl';

import { SelectContentSection } from 'apps/markdown/components/SelectContent/SelectContentSection';
import { commonMessages } from 'apps/markdown/components/SelectContent/commonMessages';
import { browserLanguage } from 'apps/markdown/components/SelectContent/utils';
import { MarkdownAppData } from 'apps/markdown/data/MarkdownAppData';
import { SelectContentResourceProps } from 'components/SelectContent/SelectContentTargetedResource';
import { buildContentItems } from 'components/SelectContent/utils';

const SelectContentResource = ({
  playlist,
  lti_select_form_data,
  setContentItemsValue,
}: SelectContentResourceProps) => {
  const intl = useIntl();
  const useCreateMarkdownDocumentMutation = useCreateMarkdownDocument({
    onSuccess: (markdownDocument) =>
      buildContentItems(
        `${MarkdownAppData.new_markdown_url || ''}${markdownDocument.id}`,
        markdownDocument.translations[0].title,
        null,
        lti_select_form_data,
        setContentItemsValue,
      ),
  });

  return (
    <Box>
      <Box align="center">
        <Heading>{intl.formatMessage(commonMessages.titleMarkdown)}</Heading>
      </Box>
      <SelectContentSection
        addAndSelectContent={() => {
          useCreateMarkdownDocumentMutation.mutate({
            playlist: playlist.id,
            title: lti_select_form_data?.activity_title,
          });
        }}
        newLtiUrl={MarkdownAppData.new_markdown_url || ''}
        items={MarkdownAppData.markdowns || null}
        language={browserLanguage}
        lti_select_form_data={lti_select_form_data}
        setContentItemsValue={setContentItemsValue}
      />
    </Box>
  );
};

export default SelectContentResource;
