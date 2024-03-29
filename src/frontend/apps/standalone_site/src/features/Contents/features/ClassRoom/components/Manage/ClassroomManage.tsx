import { Button } from '@openfun/cunningham-react';
import { useDeleteClassrooms } from 'lib-classroom';
import {
  Box,
  Heading,
  Modal,
  ModalButton,
  Text,
  report,
  withLink,
} from 'lib-components';
import { Fragment, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';
import { useLocation, useNavigate } from 'react-router-dom';

import { ContentsHeader } from 'features/Contents';
import { useSelectFeatures } from 'features/Contents/store/selectionStore';

import routes from '../../routes';

import ClassroomCreateForm from './ClassRoomCreateForm';

const ButtonWithLink = withLink(Button);

const messages = defineMessages({
  ClassroomTitle: {
    defaultMessage: 'Classrooms',
    description: 'Classrooms title',
    id: 'features.Contents.features.ClassRooms.Manage.ClassroomTitle',
  },
  CreateClassroomLabel: {
    defaultMessage: 'Create Classroom',
    description: 'Button label to select classrooms',
    id: 'features.Contents.features.ClassRooms.Manage.CreateClassroomLabel',
  },
  SelectButtonLabel: {
    defaultMessage: 'Select',
    description: 'Text heading select classrooms.',
    id: 'features.Contents.features.ClassRooms.Manage.SelectButtonLabel',
  },
  DeleteButtonLabel: {
    defaultMessage: `Delete {item_count, plural,  =0 {0 classroom} one {# classroom} other {# classrooms}}`,
    description: 'Button label to delete single classroom.',
    id: 'features.Contents.features.ClassRooms.Manage.DeleteButtonSingularLabel',
  },
  CancelSelectionLabel: {
    defaultMessage: 'Cancel',
    description: 'Button label to cancel classroom selection.',
    id: 'features.Contents.features.ClassRooms.Manage.CancelSelectionLabel',
  },
  classroomsDeleteModalTitle: {
    defaultMessage: `Delete {item_count, plural, one {# classroom} other {# classrooms}}`,
    description: 'Title of the classroom delete modal.',
    id: 'features.Contents.features.ClassRooms.Manage.classroomsDeleteModalTitle',
  },
  confirmDeleteClassroomsTitle: {
    defaultMessage: `Confirm delete {item_count, plural, one {# classroom} other {# classrooms}}`,
    description: 'Title of the widget used for classroom delete confirmation.',
    id: 'features.Contents.features.ClassRooms.Manage.confirmDeleteClassroomsTitle',
  },
  confirmDeleteClassroomsText: {
    defaultMessage: `Are you sure you want to delete {item_count, plural, one {# classroom} other {# classrooms}} ? This action is irreversible.`,
    description: 'Text of the widget used for classroom delete confirmation.',
    id: 'features.Contents.features.ClassRooms.Manage.confirmDeleteClassroomsText',
  },
  classroomsDeleteSuccess: {
    defaultMessage: `{item_count, plural, one {# classroom} other {# classrooms}} successfully deleted`,
    description: 'Text of the classroom delete confirmation toast.',
    id: 'features.Contents.features.ClassRooms.Manage.classroomsDeleteSuccess',
  },
  classroomsDeleteError: {
    defaultMessage: `Failed to delete {item_count, plural, one {# classroom} other {# classrooms}}`,
    description: 'Text of the classroom delete error toast.',
    id: 'features.Contents.features.ClassRooms.Manage.classroomsDeleteError',
  },
});

const ClassroomManage = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const location = useLocation();

  const classroomRoute = routes.CLASSROOM;
  const classroomCreatePath = classroomRoute.subRoutes.CREATE.path;
  const {
    isSelectionEnabled,
    switchSelectEnabled,
    resetSelection,
    selectedItems,
  } = useSelectFeatures();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  const deleteClassrooms = useDeleteClassrooms({
    onSuccess: (_, variables) => {
      toast.success(
        intl.formatMessage(messages.classroomsDeleteSuccess, {
          item_count: variables.ids.length,
        }),
        {
          position: 'bottom-center',
        },
      );
    },
    onError: (err, variables) => {
      report(err);
      toast.error(
        intl.formatMessage(messages.classroomsDeleteError, {
          item_count: variables.ids.length,
        }),
        {
          position: 'bottom-center',
        },
      );
    },
  });

  useEffect(() => {
    return () => {
      resetSelection();
    };
  }, [resetSelection]);

  return (
    <Fragment>
      <ContentsHeader>
        <Heading level={3} className="m-0">
          {intl.formatMessage(messages.ClassroomTitle)}
        </Heading>
        {!isSelectionEnabled && (
          <Box direction="row" gap="small">
            <Button
              color="secondary"
              aria-label={intl.formatMessage(messages.SelectButtonLabel)}
              onClick={switchSelectEnabled}
            >
              {intl.formatMessage(messages.SelectButtonLabel)}
            </Button>
            <ButtonWithLink
              to={classroomCreatePath}
              aria-label={intl.formatMessage(messages.CreateClassroomLabel)}
            >
              {intl.formatMessage(messages.CreateClassroomLabel)}
            </ButtonWithLink>
          </Box>
        )}
        {isSelectionEnabled && (
          <Box direction="row" gap="small">
            <Button
              color="secondary"
              aria-label={intl.formatMessage(messages.CancelSelectionLabel)}
              onClick={switchSelectEnabled}
            >
              {intl.formatMessage(messages.CancelSelectionLabel)}
            </Button>
            <Button
              color="danger"
              aria-label={intl.formatMessage(messages.DeleteButtonLabel, {
                item_count: selectedItems.length,
              })}
              disabled={selectedItems.length < 1}
              onClick={() => setIsDeleteModalOpen(true)}
            >
              {intl.formatMessage(messages.DeleteButtonLabel, {
                item_count: selectedItems.length,
              })}
            </Button>
          </Box>
        )}
      </ContentsHeader>
      {location.pathname.includes(classroomCreatePath) && (
        <Modal
          isOpen
          onClose={() => {
            navigate('..');
          }}
        >
          <Heading level={2} textAlign="center" className="mt-0 mb-sl">
            {intl.formatMessage(messages.CreateClassroomLabel)}
          </Heading>
          <ClassroomCreateForm />
        </Modal>
      )}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
        }}
      >
        <Heading level={2} textAlign="center" className="mt-st mb-b">
          {intl.formatMessage(messages.classroomsDeleteModalTitle, {
            item_count: selectedItems.length,
          })}
        </Heading>
        <Text className="mt-t">
          {intl.formatMessage(messages.confirmDeleteClassroomsText, {
            item_count: selectedItems.length,
          })}
        </Text>
        <ModalButton
          aria-label={intl.formatMessage(
            messages.confirmDeleteClassroomsTitle,
            {
              item_count: selectedItems.length,
            },
          )}
          onClickCancel={() => {
            setIsDeleteModalOpen(false);
          }}
          onClickSubmit={() => {
            deleteClassrooms.mutate({ ids: selectedItems });
            setIsDeleteModalOpen(false);
            switchSelectEnabled();
          }}
          color="danger"
        >
          {intl.formatMessage(messages.confirmDeleteClassroomsTitle, {
            item_count: selectedItems.length,
          })}
        </ModalButton>
      </Modal>
    </Fragment>
  );
};

export default ClassroomManage;
