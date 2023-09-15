import { Box } from 'grommet';
import { Heading } from 'lib-components';
import React from 'react';
import { useIntl } from 'react-intl';

import { SelectContentSection } from 'apps/deposit/components/SelectContent/SelectContentSection';
import { commonMessages } from 'apps/deposit/components/SelectContent/commonMessages';
import { depositAppData } from 'apps/deposit/data/depositAppData';
import { useCreateFileDepository } from 'apps/deposit/data/queries';
import { SelectContentResourceProps } from 'components/SelectContent/SelectContentTargetedResource';
import { buildContentItems } from 'components/SelectContent/utils';

const SelectContentResource = ({
  playlist,
  lti_select_form_data,
  setContentItemsValue,
}: SelectContentResourceProps) => {
  const intl = useIntl();
  const useCreateFileDepositoryMutation = useCreateFileDepository({
    onSuccess: (fileDepository) =>
      buildContentItems(
        `${depositAppData.new_deposit_url || ''}${fileDepository.id}`,
        fileDepository.title,
        fileDepository.description,
        lti_select_form_data,
        setContentItemsValue,
      ),
  });

  return (
    <Box>
      <Box align="center">
        <Heading>{intl.formatMessage(commonMessages.titleDeposit)}</Heading>
      </Box>
      <SelectContentSection
        addAndSelectContent={() => {
          useCreateFileDepositoryMutation.mutate({
            playlist: playlist.id,
            title: lti_select_form_data?.activity_title,
            description: lti_select_form_data?.activity_description,
          });
        }}
        newLtiUrl={depositAppData.new_deposit_url || ''}
        items={depositAppData.deposits || null}
        lti_select_form_data={lti_select_form_data}
        setContentItemsValue={setContentItemsValue}
      />
    </Box>
  );
};

export default SelectContentResource;
