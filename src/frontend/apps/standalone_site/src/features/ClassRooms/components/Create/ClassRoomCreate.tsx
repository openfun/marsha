import { Layer, Button, Box, Heading } from 'grommet';
import { FormClose } from 'grommet-icons';
import { normalizeColor } from 'grommet/utils';
import { theme } from 'lib-common';
import React, { Fragment, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { useResponsive } from 'hooks/useResponsive';

import ClassroomCreateForm from './ClassRoomCreateForm';

const FormCloseIcon = styled(FormClose)`
  background-color: ${normalizeColor('blue-active', theme)};
  border-radius: 100%;
  align-self: end;
  cursor: pointer;
`;

const messages = defineMessages({
  AddClassroom: {
    defaultMessage: 'Add Classroom',
    description: 'Text button add classroom.',
    id: 'features.ClassRooms.Create.AddClassroom',
  },
});

function ClassRoomCreate() {
  const intl = useIntl();
  const [isShowModal, setIsShowModal] = useState(false);
  const { isDesktop } = useResponsive();

  return (
    <Fragment>
      <Button
        primary
        label={intl.formatMessage(messages.AddClassroom)}
        onClick={() => setIsShowModal(true)}
      />
      {isShowModal && (
        <Layer
          onEsc={() => setIsShowModal(false)}
          onClickOutside={() => setIsShowModal(false)}
        >
          <Box
            width={isDesktop ? { max: '650px', width: '80vw' } : undefined}
            pad="medium"
          >
            <FormCloseIcon
              color="white"
              onClick={() => setIsShowModal(false)}
            />
            <Heading
              level={2}
              margin={{ top: 'xxsmall' }}
              textAlign="center"
              weight="bold"
            >
              {intl.formatMessage(messages.AddClassroom)}
            </Heading>
            <ClassroomCreateForm onSubmit={() => setIsShowModal(false)} />
          </Box>
        </Layer>
      )}
    </Fragment>
  );
}

export default ClassRoomCreate;
