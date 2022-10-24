import { Tab } from 'grommet';
import React from 'react';
import { useIntl } from 'react-intl';

import { SelectContentTabProps } from 'components/SelectContent/SelectContentTabs';
import { buildContentItems } from 'components/SelectContent/utils';

import { commonMessages } from 'apps/classroom/components/SelectContent/commonMessages';
import { SelectContentSection } from 'apps/classroom/components/SelectContent/SelectContentSection';
import { useCreateClassroom } from 'lib-classroom';
import { classroomAppData } from 'apps/classroom/data/classroomAppData';

const Internal = ({
  playlist,
  lti_select_form_data,
  setContentItemsValue,
}: SelectContentTabProps) => {
  const useCreateClassroomMutation = useCreateClassroom({
    onSuccess: (classroom) =>
      buildContentItems(
        classroomAppData.new_classroom_url! + classroom.id,
        classroom.title,
        classroom.description,
        lti_select_form_data,
        setContentItemsValue,
      ),
  });

  return (
    <SelectContentSection
      addAndSelectContent={() => {
        useCreateClassroomMutation.mutate({
          playlist: playlist!.id,
          title: lti_select_form_data?.activity_title,
          description: lti_select_form_data?.activity_description,
        });
      }}
      newLtiUrl={classroomAppData.new_classroom_url!}
      items={classroomAppData.classrooms!}
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

  if (!classroomAppData.classrooms) {
    return null;
  }

  return (
    <Tab title={intl.formatMessage(commonMessages.titleClassroom)}>
      {content}
    </Tab>
  );
};

export default SelectContentTab;
