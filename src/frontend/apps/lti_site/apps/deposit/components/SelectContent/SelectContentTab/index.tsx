import { Tab } from 'grommet';
import { DocumentStore } from 'grommet-icons';
import React from 'react';

import {
  RichTabTitle,
  SelectContentTabProps,
} from 'components/SelectContent/SelectContentTabs';
import { buildContentItems } from 'components/SelectContent/utils';

import { SelectContentSection } from 'apps/deposit/components/SelectContent/SelectContentSection';
import { depositAppData } from 'apps/deposit/data/depositAppData';
import { useCreateFileDepository } from 'apps/deposit/data/queries';
import { commonMessages } from 'apps/deposit/components/SelectContent/commonMessages';
import { useIntl } from 'react-intl';

const Internal = ({
  playlist,
  lti_select_form_data,
  setContentItemsValue,
}: SelectContentTabProps) => {
  const useCreateFileDepositoryMutation = useCreateFileDepository({
    onSuccess: (fileDepository) =>
      buildContentItems(
        depositAppData.new_deposit_url! + fileDepository.id,
        fileDepository.title,
        fileDepository.description,
        lti_select_form_data,
        setContentItemsValue,
      ),
  });

  return (
    <SelectContentSection
      addAndSelectContent={() => {
        useCreateFileDepositoryMutation.mutate({
          playlist: playlist!.id,
          title: lti_select_form_data?.activity_title,
          description: lti_select_form_data?.activity_description,
        });
      }}
      newLtiUrl={depositAppData.new_deposit_url!}
      items={depositAppData.deposits!}
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

  if (!depositAppData.deposits) {
    return null;
  }

  return (
    <Tab
      title={
        <RichTabTitle
          icon={
            <DocumentStore a11yTitle="" size="medium" color="blue-active" />
          }
          label={intl.formatMessage(commonMessages.titleDeposit)}
        />
      }
    >
      {content}
    </Tab>
  );
};

export default SelectContentTab;
