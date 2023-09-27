import { Box, CheckBox } from 'grommet';
import { FormSchedule, InProgress } from 'grommet-icons';
import { ClassroomLite, ContentCard, StyledLink, Text } from 'lib-components';
import { Fragment, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import { ReactComponent as VueListIcon } from 'assets/svg/iko_vuelistesvg.svg';
import { ReactComponent as ClassroomsIcon } from 'assets/svg/iko_webinairesvg.svg';
import { useSelectFeatures } from 'features/Contents/store/selectionStore';
import { localDate } from 'utils/date';

import routes from '../../routes';

const ClassRoom = ({ classroom }: { classroom: ClassroomLite }) => {
  const intl = useIntl();
  const classroomPath = `${routes.CLASSROOM.path}/${classroom.id}`;

  const { isSelectionEnabled, selectedItems, selectItem } = useSelectFeatures();
  const [isClassroomSelected, setIsClassroomSelected] = useState<boolean>(
    () => selectedItems.includes(classroom.id) || false,
  );

  useEffect(() => {
    if (!isSelectionEnabled) {
      setIsClassroomSelected(false);
    }
  }, [isSelectionEnabled, setIsClassroomSelected]);

  return (
    <StyledLink to={isSelectionEnabled ? '#' : `${classroomPath}`}>
      <ContentCard
        style={
          isClassroomSelected
            ? {
                boxShadow:
                  'inset 0px 0px 0px 0px #45a3ff, #81ade6 1px 1px 1px 9px',
              }
            : undefined
        }
        onClick={() =>
          selectItem(classroom.id, isClassroomSelected, setIsClassroomSelected)
        }
        header={
          <Box
            width="100%"
            height="150px"
            align="center"
            justify="center"
            background="radial-gradient(ellipse at center, #8682bc 0%,#6460c3 100%);"
            style={{ position: 'relative' }}
          >
            <Box
              style={{
                position: 'absolute',
                top: '21px',
                left: '21px',
                background: 'white',
                borderRadius: '6px',
              }}
            >
              {isSelectionEnabled && <CheckBox checked={isClassroomSelected} />}
            </Box>
            <ClassroomsIcon width={70} height={70} color="white" />
            <Text
              weight="bold"
              color="white"
              textAlign="center"
              className="mt-t"
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
                <Text size="tiny" weight="bold">
                  {localDate(classroom.starting_at, intl.locale)}
                </Text>
              </Box>
            )}
            {classroom.estimated_duration && (
              <Box gap="small" align="center" direction="row">
                <Box>
                  <InProgress color="blue-active" style={{ height: '20px' }} />
                </Box>
                <Text size="tiny" weight="bold">
                  {classroom.estimated_duration}
                </Text>
              </Box>
            )}
            <Box gap="small" align="center" direction="row">
              <Box>
                <VueListIcon width={20} height={20} color="blue-active" />
              </Box>
              <Text size="tiny" weight="bold">
                {classroom.playlist.title}
              </Text>
            </Box>
          </Fragment>
        }
        title={classroom.title || ''}
      >
        {classroom.description && (
          <Text
            size="small"
            truncate={5}
            color="grey"
            title={classroom.description}
          >
            {classroom.description}
          </Text>
        )}
      </ContentCard>
    </StyledLink>
  );
};

export default ClassRoom;
