import { report } from 'lib-components';
import { defineMessages, useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';

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
  const history = useHistory();
  const { mutate, isLoading: isCreating } = useCreatePlaylist({
    onSuccess: () => {
      history.push(routes.PLAYLIST.path);
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
              `Submit create playlist form succeed with invalid data, submited data : ${values.toString()}`,
            ),
          );
          return;
        }

        mutate({
          organization: values.organizationId,
          title: values.name,
        });
      }}
      onCancel={() => {
        history.push(routes.PLAYLIST.path);
      }}
      submitTitle={intl.formatMessage(messages.createPlaylistButtonTitle)}
      isSubmiting={isCreating}
    />
  );
};
