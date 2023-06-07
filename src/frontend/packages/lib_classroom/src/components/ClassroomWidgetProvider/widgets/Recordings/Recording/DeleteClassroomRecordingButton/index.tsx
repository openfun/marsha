import { Heading, Text } from 'grommet';
import {
  BinSVG,
  ButtonLoader,
  ButtonLoaderStyle,
  ClassroomRecording,
  Modal,
  ModalButton,
  report,
} from 'lib-components';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { useDeleteClassroomRecording } from '@lib-classroom/data';

const messages = defineMessages({
  buttonLabel: {
    defaultMessage: 'Click on this button to delete the classroom recording.',
    description: 'The label of the button to delete a classroom recording.',
    id: 'components.DeleteRecordingButton.buttonLabel',
  },
  confirmDeleteTitle: {
    defaultMessage: 'Confirm delete classroom recording',
    description:
      'The label of the confirm button to delete a classroom recording.',
    id: 'components.DeleteClassroomRecording.confirmDeleteTitle',
  },
  confirmDeleteText: {
    defaultMessage:
      'Are you sure you want to delete this classroom recording ? This action is irreversible.',
    description: 'Text of the widget used for confirmation.',
    id: 'components.DeleteClassroomRecording.confirmDeleteText',
  },
  classroomDeleteSuccess: {
    defaultMessage: 'Classroom recording successfully deleted',
    description: 'Text of the delete confirmation toast.',
    id: 'components.DeleteClassroomRecording.classroomDeleteSuccess',
  },
  classroomDeleteError: {
    defaultMessage: 'Failed to delete the classroom recording',
    description: 'ext of the delete error toast..',
    id: 'components.DeleteClassroomRecording.classroomDeleteError',
  },
  deleteModalTitle: {
    defaultMessage: 'Delete classroom recording',
    description: 'Title of the delete modal.',
    id: 'components.DeleteClassroomRecording.deleteModalTitle',
  },
});

interface DeleteClassroomRecordingButtonProps {
  recording: ClassroomRecording;
}

export const DeleteClassroomRecordingButton = ({
  recording,
}: DeleteClassroomRecordingButtonProps) => {
  const intl = useIntl();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const deleteClassroomRecording = useDeleteClassroomRecording({
    onSuccess: () => {
      toast.success(intl.formatMessage(messages.classroomDeleteSuccess), {
        position: 'bottom-center',
      });
    },
    onError: (err: unknown) => {
      report(err);
      toast.error(intl.formatMessage(messages.classroomDeleteError), {
        position: 'bottom-center',
      });
    },
  });

  return (
    <div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Heading
          size="3"
          alignSelf="center"
          margin={{ top: '0', bottom: 'small' }}
        >
          {intl.formatMessage(messages.deleteModalTitle)}
        </Heading>
        <Text margin={{ top: 'small' }}>
          {intl.formatMessage(messages.confirmDeleteText)}
        </Text>
        <ModalButton
          label={intl.formatMessage(messages.confirmDeleteTitle)}
          onClickCancel={() => setIsModalOpen(false)}
          onClickSubmit={() => {
            setIsModalOpen(false);
            deleteClassroomRecording.mutate({
              classroomId: recording.classroom,
              classroomRecordingId: recording.id,
            });
          }}
          style={ButtonLoaderStyle.DESTRUCTIVE}
        />
      </Modal>
      <ButtonLoader
        a11yTitle={intl.formatMessage(messages.buttonLabel)}
        spinnerProps={{ size: 'small' }}
        onClickSubmit={() => setIsModalOpen(true)}
        isSubmitting={deleteClassroomRecording.isLoading}
      >
        <BinSVG height="18px" iconColor="blue-active" width="14px" />
      </ButtonLoader>
    </div>
  );
};
