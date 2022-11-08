import { Box, Heading } from 'grommet';
import { useCreateClassroom } from 'lib-classroom';
import React from 'react';
import { useIntl } from 'react-intl';

import { classroomAppData } from 'apps/classroom/data/classroomAppData';
import { commonMessages } from 'apps/classroom/components/SelectContent/commonMessages';
import { SelectContentSection } from 'apps/classroom/components/SelectContent/SelectContentSection';
import { SelectContentResourceProps } from 'components/SelectContent/SelectContentTargetedResource';
import { buildContentItems } from 'components/SelectContent/utils';

const SelectContentResource = ({
  playlist,
  lti_select_form_data,
  setContentItemsValue,
}: SelectContentResourceProps) => {
  const intl = useIntl();
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
    <Box>
      <Box align="center">
        <Heading>{intl.formatMessage(commonMessages.titleClassroom)}</Heading>
      </Box>
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
    </Box>
  );
};

export default SelectContentResource;
