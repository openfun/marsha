import { Tab } from 'grommet';
import React from 'react';
import { useIntl } from 'react-intl';

import { SelectContentTabProps } from 'components/SelectContent/SelectContentTabs';
import { buildContentItems } from 'components/SelectContent/utils';

import { commonMessages } from 'apps/{{cookiecutter.app_name}}/components/SelectContent/commonMessages';
import { SelectContentSection } from 'apps/{{cookiecutter.app_name}}/components/SelectContent/SelectContentSection';
import { {{cookiecutter.app_name}}AppData } from 'apps/{{cookiecutter.app_name}}/data/{{cookiecutter.app_name}}AppData';
import { useCreate{{cookiecutter.model}} } from 'apps/{{cookiecutter.app_name}}/data/queries';

const Internal = ({
  playlist,
  lti_select_form_data,
  setContentItemsValue,
}: SelectContentTabProps) => {
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

  if (!{{cookiecutter.app_name}}AppData.{{ cookiecutter.app_name_lower_plural }}) {
    return null;
  }

  return (
    <Tab title={intl.formatMessage(commonMessages.title{{cookiecutter.app_name_capitalized}})}>{content}</Tab>
  );
};

export default SelectContentTab;
