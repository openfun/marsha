import { report } from 'lib-components';
import { defineMessages, useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';

import { routes } from 'routes';

import { useCreatePlaylist } from '../api/useCreatePlaylist';

import { PlaylistForm } from './PlaylistForm';

const messages = defineMessages({
  formTitle: {
    defaultMessage: 'Create a playlist',
    description: 'Create playlist modale title',
    id: 'feature.Playlist.CreatePlaylistForm.formTitle',
  },
  createPlaylistButtonTitle: {
    defaultMessage: 'Create playlist',
    description: 'Create playlist button title to submit create form.',
    id: 'feature.Playlist.CreatePlaylistForm.createPlaylistButtonTitle',
  },
});

export const CreatePlaylistForm = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const { mutate, isLoading: isCreating } = useCreatePlaylist({
    onSuccess: () => {
      navigate(routes.PLAYLIST.path);
    },
  });

  return (
    <PlaylistForm
      title={intl.formatMessage(messages.formTitle)}
      onSubmit={(values) => {
        if (!values.name || !values.organizationId) {
          //  should not happen with validation.
          report(
            new Error(
              `Submit create playlist form succeed with invalid data, submited data : ${JSON.stringify(
                values,
              )}`,
            ),
          );
          return;
        }

        mutate({
          organization: values.organizationId,
          title: values.name,
          retention_duration: values.retention_duration || null,
        });
      }}
      onCancel={() => {
        navigate('..');
      }}
      submitTitle={intl.formatMessage(messages.createPlaylistButtonTitle)}
      isSubmitting={isCreating}
    />
  );
};
