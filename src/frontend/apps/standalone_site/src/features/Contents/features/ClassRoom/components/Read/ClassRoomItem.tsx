import { Text, Box } from 'grommet';
import { FormSchedule, InProgress } from 'grommet-icons';
import {
  ClassroomLite,
  StyledLink,
  ContentCard,
  TextTruncated,
} from 'lib-components';
import { Fragment } from 'react';
import { useIntl } from 'react-intl';

import { ReactComponent as VueListIcon } from 'assets/svg/iko_vuelistesvg.svg';
import { ReactComponent as ClassroomsIcon } from 'assets/svg/iko_webinairesvg.svg';
import { routes } from 'routes';
import { localDate } from 'utils/date';

const ClassRoom = ({ classroom }: { classroom: ClassroomLite }) => {
  const intl = useIntl();
  const classroomPath = routes.CONTENTS.subRoutes.CLASSROOM.path;

  return (
    <StyledLink to={`${classroomPath}/${classroom.id}`}>
      <ContentCard
        header={
          <Box
            width="100%"
            height="150px"
            align="center"
            justify="center"
            background="radial-gradient(ellipse at center, #8682bc 0%,#6460c3 100%);"
          >
            <ClassroomsIcon width={70} height={70} color="white" />
            <Text
              weight="bold"
              color="white"
              textAlign="center"
              size="small"
              margin={{ top: 'small' }}
              truncate
              style={{ maxWidth: '85%' }}
            >
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
            <Box gap="small" align="center" direction="row">
              <Box>
                <VueListIcon width={20} height={20} color="blue-active" />
              </Box>
              <Text size="0.688rem" weight="bold">
                {classroom.playlist.title}
              </Text>
            </Box>
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
    </StyledLink>
  );
};

export default ClassRoom;
