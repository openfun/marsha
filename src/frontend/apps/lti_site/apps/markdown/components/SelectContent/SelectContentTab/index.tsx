import { Tab } from 'grommet';
import React from 'react';
import { useIntl } from 'react-intl';

import { SelectContentTabProps } from 'components/SelectContent/SelectContentTabs';
import { buildContentItems } from 'components/SelectContent/utils';

import { commonMessages } from 'apps/markdown/components/SelectContent/commonMessages';
import { SelectContentSection } from 'apps/markdown/components/SelectContent/SelectContentSection';
import { browserLanguage } from 'apps/markdown/components/SelectContent/utils';
import { MarkdownAppData } from 'apps/markdown/data/MarkdownAppData';
import { useCreateMarkdownDocument } from 'apps/markdown/data/queries';

const Internal = ({
  playlist,
  lti_select_form_data,
  setContentItemsValue,
}: SelectContentTabProps) => {
  const useCreateMarkdownDocumentMutation = useCreateMarkdownDocument({
    onSuccess: (markdownDocument) =>
      buildContentItems(
        MarkdownAppData.new_markdown_url! + markdownDocument.id,
        markdownDocument.translations[0].title,
        null,
        lti_select_form_data,
        setContentItemsValue,
      ),
  });

  return (
    <SelectContentSection
      addAndSelectContent={() => {
        useCreateMarkdownDocumentMutation.mutate({
          playlist: playlist!.id,
          title: lti_select_form_data?.activity_title,
        });
      }}
      newLtiUrl={MarkdownAppData.new_markdown_url!}
      items={MarkdownAppData.markdowns!}
      language={browserLanguage}
      lti_select_form_data={lti_select_form_data}
      setContentItemsValue={setContentItemsValue}
    />
  );
};

const SelectContentTab = ({
  playlist,
  lti_select_form_data,
  setContentItemsValue,
}: SelectContentTabProps) => {
  const intl = useIntl();

  /**
   * This is a hack allowing us to test the component.
   * Otherwise we can't wrap it in a Tabs directly. The
   * component is render in an infinite loop and the test never ends.
   */
  const content = React.useMemo(
    () => (
      <Internal
        playlist={playlist}
        lti_select_form_data={lti_select_form_data}
        setContentItemsValue={setContentItemsValue}
      />
    ),
    [playlist, lti_select_form_data, setContentItemsValue],
  );

  if (!MarkdownAppData.markdowns) {
    return null;
  }

  return (
    <Tab title={intl.formatMessage(commonMessages.titleMarkdown)}>
      {content}
    </Tab>
  );
};

export default SelectContentTab;
