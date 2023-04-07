import { Text, TextArea, TextInput, Box } from 'grommet';
import { Alert } from 'grommet-icons';
import { useCreateClassroom } from 'lib-classroom';
import { Form, FormField } from 'lib-components';
import { Fragment, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';

import { ModalButton } from 'components/Modal';
import { useSelectPlaylist } from 'features/Playlist';
import { routes } from 'routes';

const messages = defineMessages({
  titleLabel: {
    defaultMessage: 'Title',
    description: 'Label for title in classroom creation form.',
    id: 'features.Contents.features.ClassRooms.ClassroomCreateForm.titleLabel',
  },
  descriptionLabel: {
    defaultMessage: 'Description',
    description: 'Label for description in classroom creation form.',
    id: 'features.Contents.features.ClassRooms.ClassroomCreateForm.descriptionLabel',
  },
  welcomeTextLabel: {
    defaultMessage: 'Welcome text',
    description: 'Label for welcome text in classroom creation form.',
    id: 'features.Contents.features.ClassRooms.ClassroomCreateForm.welcomeTextLabel',
  },
  requiredField: {
    defaultMessage: 'This field is required to create the classroom.',
    description: 'Message when classroom field is missing.',
    id: 'features.Contents.features.ClassRooms.ClassroomCreateForm.requiredField',
  },
  submitLabel: {
    defaultMessage: 'Add classroom',
    description: 'Label for button submit in classroom creation form.',
    id: 'features.Contents.features.ClassRooms.ClassroomCreateForm.submitLabel',
  },
  Error: {
    defaultMessage: 'Sorry, an error has occurred. Please try again.',
    description: 'Text when there is an error.',
    id: 'features.Contents.features.ClassRooms.ClassroomCreateForm.Error',
  },
  ErrorPermission: {
    defaultMessage:
      "Sorry, you don't have the permission to create a classroom.",
    description:
      'Text when there is a permission error while creating a classroom.',
    id: 'features.Contents.features.ClassRooms.ClassroomCreateForm.ErrorPermission',
  },
});

type ClassroomCreate = {
  playlist: string;
  title: string;
  description?: string;
};

enum ETypeError {
  PERMISSION = "Vous n'avez pas la permission d'effectuer cette action.",
}

const ClassroomCreateForm = () => {
  const intl = useIntl();
  const history = useHistory();
  const classroomPath = routes.CONTENTS.subRoutes.CLASSROOM.path;
  const { errorPlaylist, selectPlaylist } = useSelectPlaylist((results) => {
    setClassroom((value) => ({
      ...value,
      playlist: results[0].id,
    }));
  });
  const {
    mutate: createClassroom,
    error: errorClassroom,
    isLoading: isCreating,
  } = useCreateClassroom({
    onSuccess: (data) => {
      history.push(`${classroomPath}/${data.id}`);
    },
  });
  const [classroom, setClassroom] = useState<ClassroomCreate>({
    playlist: '',
    title: '',
    description: '',
  });
  const errorMessages = {
    [ETypeError.PERMISSION]: intl.formatMessage(messages.ErrorPermission),
  };

  return (
    <Fragment>
      {(errorClassroom || errorPlaylist) && (
        <Box
          direction="row"
          align="center"
          justify="center"
          margin={{ bottom: 'medium' }}
          gap="small"
        >
          <Alert size="42rem" color="#df8c00" />
          <Text weight="bold" size="small">
            {errorMessages[errorClassroom?.detail as ETypeError] ||
              intl.formatMessage(messages.Error)}
          </Text>
        </Box>
      )}
      <Form
        onSubmitError={() => ({})}
        onSubmit={({ value }) => createClassroom(value)}
        onChange={(values) => {
          setClassroom(values);
        }}
        messages={{
          required: intl.formatMessage(messages.requiredField),
        }}
        value={classroom}
      >
        <FormField
          label={intl.formatMessage(messages.titleLabel)}
          htmlFor="title-id"
          name="title"
          required
        >
          <TextInput size="1rem" name="title" id="title-id" />
        </FormField>

        {selectPlaylist}

        <FormField
          label={intl.formatMessage(messages.descriptionLabel)}
          htmlFor="description-id"
          name="description"
        >
          <TextArea
            size="1rem"
            rows={5}
            name="description"
            id="description-id"
          />
        </FormField>

        <ModalButton
          label={intl.formatMessage(messages.submitLabel)}
          onClickCancel={() => history.push(classroomPath)}
          isSubmitting={isCreating}
          isDisabled={!classroom.title || !classroom.playlist}
        />
      </Form>
    </Fragment>
  );
};

export default ClassroomCreateForm;
