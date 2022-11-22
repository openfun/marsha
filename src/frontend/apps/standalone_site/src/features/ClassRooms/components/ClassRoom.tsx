import { Text, Box } from 'grommet';
import { FormSchedule, InProgress } from 'grommet-icons';
import { ClassroomLite } from 'lib-components';
import React, { Fragment } from 'react';
import { useIntl } from 'react-intl';
import styled from 'styled-components';

import { ReactComponent as ClassroomsIcon } from 'assets/svg/iko_webinairesvg.svg';
import { ContentCard } from 'components/Cards';
import { localDate } from 'utils/date';

const TextTruncated = styled(Text)`
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

function ClassRoom({ classroom }: { classroom: ClassroomLite }) {
  const intl = useIntl();

  return (
    <ContentCard
      header={
        <Box
          width="100%"
          height="150px"
          align="center"
          justify="center"
          background="radial-gradient(ellipse at center, #8682bc 0%,#6460c3 100%);"
        >
          <ClassroomsIcon width={80} height={80} color="white" />
          <Text weight="bold" color="white" textAlign="center" size="small">
            {classroom.welcome_text}
          </Text>
        </Box>
      }
      footer={
        <Fragment>
          {classroom.starting_at && (
            <Box gap="small" align="center" direction="row">
              <Box>
                <FormSchedule size="medium" color="blue-active" />
              </Box>
              <Text size="0.688rem" weight="bold">
                {localDate(classroom.starting_at, intl.locale)}
              </Text>
            </Box>
          )}
          {classroom.estimated_duration && (
            <Box gap="small" align="center" direction="row">
              <Box>
                <InProgress color="blue-active" style={{ height: '20px' }} />
              </Box>
              <Text size="0.688rem" weight="bold">
                {classroom.estimated_duration}
              </Text>
            </Box>
          )}
        </Fragment>
      }
      title={classroom.title || ''}
    >
      {classroom.description && (
        <TextTruncated
          size="0.688rem"
          color="grey"
          title={classroom.description}
        >
          {classroom.description}
        </TextTruncated>
      )}
    </ContentCard>
  );
}

export default ClassRoom;
