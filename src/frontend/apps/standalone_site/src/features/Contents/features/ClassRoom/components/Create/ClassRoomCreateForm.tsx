import { Text, TextArea, TextInput, Select, Box } from 'grommet';
import { Alert } from 'grommet-icons';
import { useCreateClassroom } from 'lib-classroom';
import { Playlist, Form, FormField } from 'lib-components';
import { Fragment, useState, useEffect } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';

import { ModalButton } from 'components/Modal';
import { ITEM_PER_PAGE } from 'conf/global';
import { PlaylistOrderType, usePlaylists } from 'features/Playlist';
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
  selectPlaylistLabel: {
    defaultMessage: 'Choose the playlist.',
    description: 'Label select playlist.',
    id: 'features.Contents.features.ClassRooms.ClassroomCreateForm.selectPlaylistLabel',
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

interface ClassroomCreateFormProps {
  onSubmit: () => void;
}

const ClassroomCreateForm = ({ onSubmit }: ClassroomCreateFormProps) => {
  const intl = useIntl();
  const history = useHistory();
  const [currentPlaylistPage, setCurrentPlaylistPage] = useState(0);
  const [isPlaylistInit, setIsPlaylistInit] = useState(false);
  const { data: playlistResponse, error: errorPlaylist } = usePlaylists(
    {
      offset: `${currentPlaylistPage * ITEM_PER_PAGE}`,
      limit: `${ITEM_PER_PAGE}`,
      ordering: PlaylistOrderType.BY_CREATED_ON_REVERSED,
      can_edit: 'true',
    },
    {
      keepPreviousData: true,
      staleTime: 20000,
      onSuccess: (data) => {
        if (isPlaylistInit) {
          return;
        }

        if (!data || data.count === 0) {
          return;
        }

        setIsPlaylistInit(true);
        setClassroom((value) => ({
          ...value,
          playlist: data.results[0].id,
        }));
      },
    },
  );
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const {
    mutate: createClassroom,
    error: errorClassroom,
    isLoading: isCreating,
  } = useCreateClassroom({
    onSuccess: (data) => {
      onSubmit();

      const classroomRoute = routes.CONTENTS.subRoutes.CLASSROOM;
      const classroomPath = classroomRoute.path;

      history.push(`${classroomPath}/${data.id}`);
    },
  });
  const [classroom, setClassroom] = useState<ClassroomCreate>({
    playlist: '',
    title: '',
    description: '',
  });

  useEffect(() => {
    if (!playlistResponse || !playlistResponse.results) {
      return;
    }

    setPlaylists((currentPlaylists) => [
      ...currentPlaylists,
      ...playlistResponse.results,
    ]);
  }, [playlistResponse]);

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

        <FormField
          label={intl.formatMessage(messages.selectPlaylistLabel)}
          htmlFor="select-playlist-id"
          name="playlist"
          required
        >
          <Select
            id="select-playlist-id"
            name="playlist"
            size="medium"
            aria-label={intl.formatMessage(messages.selectPlaylistLabel)}
            options={playlists}
            labelKey="title"
            valueKey={{ key: 'id', reduce: true }}
            onMore={() => {
              if (!playlistResponse) {
                return;
              }

              if (playlists.length < playlistResponse.count) {
                setCurrentPlaylistPage((currentPage) => currentPage + 1);
              }
            }}
            dropHeight="medium"
          />
        </FormField>

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
          onClickCancel={() => {
            onSubmit();
          }}
          isSubmiting={isCreating}
        />
      </Form>
    </Fragment>
  );
};

export default ClassroomCreateForm;
