import {
  Form,
  FormField,
  Text,
  TextArea,
  TextInput,
  Button,
  Select,
  Box,
} from 'grommet';
import { Alert } from 'grommet-icons';
import { useCreateClassroom } from 'lib-classroom';
import { Playlist } from 'lib-components';
import { Fragment, useState, useEffect } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { ITEM_PER_PAGE } from 'conf/global';
import { PlaylistOrderType, usePlaylists } from 'features/Playlist';

const messages = defineMessages({
  titleLabel: {
    defaultMessage: 'Title',
    description: 'Label for title in classroom creation form.',
    id: 'component.ClassroomCreateForm.titleLabel',
  },
  descriptionLabel: {
    defaultMessage: 'Description',
    description: 'Label for description in classroom creation form.',
    id: 'component.ClassroomCreateForm.descriptionLabel',
  },
  welcomeTextLabel: {
    defaultMessage: 'Welcome text',
    description: 'Label for welcome text in classroom creation form.',
    id: 'component.ClassroomCreateForm.welcomeTextLabel',
  },
  requiredField: {
    defaultMessage: 'This field is required to create the classroom.',
    description: 'Message when classroom field is missing.',
    id: 'component.ClassroomCreateForm.requiredField',
  },
  selectPlaylistLabel: {
    defaultMessage: 'Choose the playlist.',
    description: 'Label select playlist.',
    id: 'component.ClassroomCreateForm.selectPlaylistLabel',
  },
  submitLabel: {
    defaultMessage: 'Add classroom',
    description: 'Label for button submit in classroom creation form.',
    id: 'component.ClassroomCreateForm.submitLabel',
  },
  Error: {
    defaultMessage: 'Sorry, an error has occurred. Please try again.',
    description: 'Text when there is an error.',
    id: 'features.ClassroomCreateForm.Error',
  },
});

type ClassroomCreate = {
  playlist: string;
  title: string;
  description?: string;
};

interface ClassroomCreateFormProps {
  onSubmit?: () => void;
}

const ClassroomCreateForm = ({ onSubmit }: ClassroomCreateFormProps) => {
  const intl = useIntl();
  const [currentPlaylistPage, setCurrentPlaylistPage] = useState(0);
  const { data: playlistResponse, error: errorPlaylist } = usePlaylists(
    {
      offset: `${currentPlaylistPage * ITEM_PER_PAGE}`,
      limit: `${ITEM_PER_PAGE}`,
      ordering: PlaylistOrderType.BY_CREATED_ON_REVERSED,
    },
    { keepPreviousData: true, staleTime: 20000 },
  );
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const { mutate: createClassroom, error: errorClassroom } = useCreateClassroom(
    {
      onSuccess: () => {
        if (onSubmit) {
          onSubmit();
        }
      },
    },
  );
  const [classroom, setClassroom] = useState<ClassroomCreate>({
    playlist: '',
    title: '',
    description: '',
  });

  const isSubmitDisabled = !classroom.title || !classroom.playlist;

  useEffect(() => {
    if (!playlistResponse || !playlistResponse.results) {
      return;
    }

    setPlaylists((currentPlaylists) => [
      ...currentPlaylists,
      ...playlistResponse.results,
    ]);
  }, [playlistResponse]);

  const fieldError = (isError: boolean) =>
    isError && (
      <Text size="small" color="status-error">
        <FormattedMessage {...messages.requiredField} />
      </Text>
    );

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
            {intl.formatMessage(messages.Error)}
          </Text>
        </Box>
      )}
      <Form>
        <FormField
          className="form-field mandatory"
          label={intl.formatMessage(messages.titleLabel)}
          htmlFor="title-id"
          required={true}
          error={fieldError(!classroom.title)}
        >
          <TextInput
            size="1rem"
            name="title"
            id="title-id"
            value={classroom.title || ''}
            onChange={(e) =>
              setClassroom({ ...classroom, title: e.target.value })
            }
          />
        </FormField>
        <FormField
          className="form-field mandatory"
          label={intl.formatMessage(messages.selectPlaylistLabel)}
          htmlFor="select-playlist-id"
          required={true}
          error={fieldError(!classroom.playlist)}
        >
          <Select
            id="select-playlist-id"
            name="playlist"
            aria-label={intl.formatMessage(messages.selectPlaylistLabel)}
            onChange={({ value }) =>
              setClassroom({ ...classroom, playlist: String(value) })
            }
            options={playlists}
            labelKey="title"
            valueKey={{ key: 'id', reduce: true }}
            placeholder={intl.formatMessage(messages.selectPlaylistLabel)}
            size="1rem"
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
          className="form-field"
          label={intl.formatMessage(messages.descriptionLabel)}
          htmlFor="description-id"
        >
          <TextArea
            size="1rem"
            rows={5}
            name="description"
            id="description-id"
            value={classroom.description || ''}
            onChange={(e) =>
              setClassroom({ ...classroom, description: e.target.value })
            }
          />
        </FormField>
        <Box direction="row" justify="center" margin={{ top: 'medium' }}>
          <Button
            disabled={isSubmitDisabled}
            primary
            size="large"
            label={intl.formatMessage(messages.submitLabel)}
            onClick={() => {
              createClassroom(classroom);
            }}
          />
        </Box>
      </Form>
    </Fragment>
  );
};

export default ClassroomCreateForm;
