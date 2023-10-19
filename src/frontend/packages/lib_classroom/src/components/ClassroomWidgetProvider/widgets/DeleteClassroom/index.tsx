import { Button } from '@openfun/cunningham-react';
import {
  FoldableItem,
  Heading,
  Modal,
  ModalButton,
  Text,
  report,
  useCurrentResourceContext,
} from 'lib-components';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';

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
    defaultMessage: 'Confirm delete classroom',
    description: 'Title of the widget used for confirmation.',
    id: 'components.DeleteClassroom.confirmDeleteTitle',
  },
  confirmDeleteText: {
    defaultMessage:
      'Are you sure you want to delete this classroom ? This action is irreversible.',
    description: 'Text of the widget used for confirmation.',
    id: 'components.DeleteClassroom.confirmDeleteText',
  },
  deleteButtonText: {
    defaultMessage: 'Delete classroom',
    description: 'Text of the delete button.',
    id: 'components.DeleteClassroom.deleteButtonText',
  },
  classroomDeleteSuccess: {
    defaultMessage: 'Classroom successfully deleted',
    description: 'Text of the delete confirmation toast.',
    id: 'components.DeleteClassroom.classroomDeleteSuccess',
  },
  classroomDeleteError: {
    defaultMessage: 'Failed to delete the classroom',
    description: 'ext of the delete error toast..',
    id: 'components.DeleteClassroom.classroomDeleteError',
  },
  deleteModalTitle: {
    defaultMessage: 'Delete classroom',
    description: 'Title of the delete modal.',
    id: 'components.DeleteClassroom.deleteModalTitle',
  },
});

export const DeleteClassroom = () => {
  const intl = useIntl();
  const [context] = useCurrentResourceContext();
  const navigate = useNavigate();
  const classroom = useCurrentClassroom();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const deleteClassroom = useDeleteClassroom({
    onSuccess: () => {
      toast.success(intl.formatMessage(messages.classroomDeleteSuccess), {
        position: 'bottom-center',
      });
      navigate('..');
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
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Heading level={2} textAlign="center" className="mt-0 mb-s">
          {intl.formatMessage(messages.deleteModalTitle)}
        </Heading>
        <Text className="mt-t">
          {intl.formatMessage(messages.confirmDeleteText)}
        </Text>
        <ModalButton
          aria-label={intl.formatMessage(messages.confirmDeleteTitle)}
          onClickCancel={() => setIsModalOpen(false)}
          onClickSubmit={() => {
            setIsModalOpen(false);
            deleteClassroom.mutate(classroom.id);
          }}
          color="danger"
        >
          {intl.formatMessage(messages.confirmDeleteTitle)}
        </ModalButton>
      </Modal>
      <Button
        disabled={!context.permissions.can_update}
        fullWidth
        aria-label={intl.formatMessage(messages.deleteButtonText)}
        title={intl.formatMessage(messages.deleteButtonText)}
        onClick={() => setIsModalOpen(true)}
        color="danger"
      >
        {intl.formatMessage(messages.deleteButtonText)}
      </Button>
    </FoldableItem>
  );
};
