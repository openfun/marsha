import { Box, Heading } from 'grommet';
import React from 'react';
import { useIntl } from 'react-intl';

import { SelectContentResourceProps } from 'components/SelectContent/SelectContentTargetedResource';
import { buildContentItems } from 'components/SelectContent/utils';

import { commonMessages } from 'apps/{{cookiecutter.app_name}}/components/SelectContent/commonMessages';
import { SelectContentSection } from 'apps/{{cookiecutter.app_name}}/components/SelectContent/SelectContentSection';
import { {{cookiecutter.app_name}}AppData } from 'apps/{{cookiecutter.app_name}}/data/{{cookiecutter.app_name}}AppData';
import { useCreate{{cookiecutter.model}} } from 'apps/{{cookiecutter.app_name}}/data/queries';

const SelectContentResource = ({
  playlist,
  lti_select_form_data,
  setContentItemsValue,
}: SelectContentResourceProps) => {
  const intl = useIntl();
  const useCreate{{cookiecutter.model}}Mutation = useCreate{{cookiecutter.model}}({
    onSuccess: ({{cookiecutter.model_lower}}) =>
      buildContentItems(
        {{cookiecutter.app_name}}AppData.new_{{ cookiecutter.app_name_lower }}_url! + {{cookiecutter.model_lower}}.id,
        {{cookiecutter.model_lower}}.title,
        {{cookiecutter.model_lower}}.description,
        lti_select_form_data,
        setContentItemsValue,
      ),
  });

  return (
    <Box>
      <Box align="center">
        <Heading>{intl.formatMessage(commonMessages.title{{cookiecutter.app_name_capitalized}})}</Heading>
      </Box>
      <SelectContentSection
        addAndSelectContent={() => {
          useCreate{{cookiecutter.model}}Mutation.mutate({
            playlist: playlist!.id,
            title: lti_select_form_data?.activity_title,
            description: lti_select_form_data?.activity_description,
          });
        }}
        newLtiUrl={{'{'}}{{cookiecutter.app_name}}AppData.new_{{ cookiecutter.app_name_lower }}_url!}
        items={{'{'}}{{cookiecutter.app_name}}AppData.{{ cookiecutter.app_name_lower_plural }}!}
        lti_select_form_data={lti_select_form_data}
        setContentItemsValue={setContentItemsValue}
      />
    </Box>
  );
};

export default SelectContentResource;
