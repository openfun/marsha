import { Button, Text } from 'grommet';
import {
  FoldableItem,
  report,
  useCurrentResourceContext,
  ModalButton,
  Modal,
  ModalButtonStyle,
} from 'lib-components';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';

import { useDeleteClassroom } from '@lib-classroom/data/queries';
import { useCurrentClassroom } from '@lib-classroom/hooks/useCurrentClassroom';

const messages = defineMessages({
  info: {
    defaultMessage:
      'DANGER ZONE : This widget allows you to delete the classroom permanently.',
    description: 'Info of the widget used for deleting the classroom.',
    id: 'components.DeleteClassroom.info',
  },
  title: {
    defaultMessage: 'DANGER ZONE',
    description: 'Title of the widget used for deleting the classroom.',
    id: 'components.DeleteClassroom.title',
  },
  confirmDeleteTitle: {
    defaultMessage: 'Confirm delete',
    description: 'Title of the widget used for confirmation.',
    id: 'components.DeleteClassroomConfirm.title',
  },
  confirmDeleteText: {
    defaultMessage:
      'Are you sure you want to delete this classroom ? This action is irreversible.',
    description: 'Text of the widget used for confirmation.',
    id: 'components.DeleteClassroomConfirm.text',
  },
  deleteButtonText: {
    defaultMessage: 'Delete classroom',
    description: 'Text of the delete button.',
    id: 'components.DeleteClassroomButton.text',
  },
  classroomDeleteSuccess: {
    defaultMessage: 'Classroom successfully deleted',
    description: 'Text of the delete confirmation toast.',
    id: 'components.deleteClassroomSuccess.text',
  },
  classroomDeleteError: {
    defaultMessage: 'Failed to delete the classroom',
    description: 'ext of the delete error toast..',
    id: 'components.classroomDeleteError.text',
  },
});

const StyledAnchorButton = styled(Button)`
  height: 50px;
  font-family: 'Roboto-Medium';
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const DeleteClassroom = () => {
  const intl = useIntl();
  const [context] = useCurrentResourceContext();
  const history = useHistory();
  const classroom = useCurrentClassroom();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const deleteClassroom = useDeleteClassroom({
    onSuccess: () => {
      toast.success(intl.formatMessage(messages.classroomDeleteSuccess), {
        position: 'bottom-center',
      });
      history.goBack();
    },
    onError: (err: unknown) => {
      report(err);
      toast.error(intl.formatMessage(messages.classroomDeleteError), {
        position: 'bottom-center',
      });
    },
  });

  if (!context.isFromWebsite) {
    return null;
  }

  return (
    <FoldableItem
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue
      title={intl.formatMessage(messages.title)}
    >
      <Modal isOpen={isModalOpen}>
        <Text margin={{ top: 'small' }}>
          {intl.formatMessage(messages.confirmDeleteText)}
        </Text>
        <ModalButton
          label={intl.formatMessage(messages.confirmDeleteTitle)}
          onClickCancel={() => setIsModalOpen(false)}
          onClickSubmit={() => {
            setIsModalOpen(false);
            deleteClassroom.mutate(classroom.id);
          }}
          style={ModalButtonStyle.DESTRUCTIVE}
        />
      </Modal>
      <StyledAnchorButton
        a11yTitle={intl.formatMessage(messages.deleteButtonText)}
        download
        disabled={!context.permissions.can_update}
        fill="horizontal"
        label={intl.formatMessage(messages.deleteButtonText)}
        target="_blank"
        rel="noopener noreferrer"
        primary
        title={intl.formatMessage(messages.deleteButtonText)}
        onClick={() => setIsModalOpen(true)}
        color="action-danger"
      />
    </FoldableItem>
  );
};
