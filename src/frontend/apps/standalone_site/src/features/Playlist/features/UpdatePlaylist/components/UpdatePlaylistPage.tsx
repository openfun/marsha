import { Box, Heading } from 'grommet';
import { report, Spinner } from 'lib-components';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';

import { WhiteCard } from 'components/Cards';
import { PlaylistForm } from 'features/Playlist';

import { usePlaylist } from '../api/usePlaylist';
import { useUpdatePlaylist } from '../api/useUpdatePlaylist';

import { AddUserAccessButton } from './AddUserAccessButton';
import { PlaylistUserList } from './PlaylistUserList';

const messages = defineMessages({
  mainInfoTitle: {
    defaultMessage: 'Main informations',
    description: 'Update playlist page, main info bloc title.',
    id: 'features.Playlist.features.UpdatePlaylist.UpdatePlaylistPage.mainInfoTitle',
  },
  accessTitle: {
    defaultMessage: 'Playlist access',
    description: 'Update playlist page, playlist access bloc title.',
    id: 'features.Playlist.features.UpdatePlaylist.UpdatePlaylistPage.accessTitle',
  },
  saveButtonTitle: {
    defaultMessage: 'Save',
    description: 'Update playlist page, save main info button title.',
    id: 'features.Playlist.features.UpdatePlaylist.UpdatePlaylistPage.saveButtonTitle',
  },
  updateSuccessMessage: {
    defaultMessage: 'Playlist updated with success.',
    description: 'Toast message when updating playlist main info succeed.',
    id: 'features.Playlist.features.UpdatePlaylist.UpdatePlaylistPage.updateSuccessMessage',
  },
  updateErrorMessage: {
    defaultMessage: 'An error occurred, please try again later.',
    description: 'Toast message when updating playlist main info failed.',
    id: 'features.Playlist.features.UpdatePlaylist.UpdatePlaylistPage.updateErrorMessage',
  },
});

export const UpdatePlaylistPage = () => {
  const intl = useIntl();
  const params = useParams<{ id: string }>();

  const { data: playlist, isLoading } = usePlaylist(params.id);
  const { mutate: updatePlaylist, isLoading: isSubmitting } = useUpdatePlaylist(
    params.id,
    {
      onSuccess: () => {
        toast.success(intl.formatMessage(messages.updateSuccessMessage));
      },
      onError: () => {
        toast.error(intl.formatMessage(messages.updateErrorMessage));
      },
    },
  );

  if (isLoading || !playlist) {
    return <Spinner />;
  }

  return (
    <Box gap="medium">
      <WhiteCard height={{ min: 'auto' }}>
        <Heading level={3}>
          {intl.formatMessage(messages.mainInfoTitle)}
        </Heading>
        <Box
          width={{ max: '100%', width: 'large' }}
          margin={{ horizontal: 'auto' }}
        >
          <PlaylistForm
            initialValues={{
              name: playlist.title,
              organizationId: playlist.organization?.id,
            }}
            isEditable={!isSubmitting}
            onSubmit={(values) => {
              if (!values.name || !values.organizationId) {
                //  should not happen with validation.
                report(
                  new Error(
                    `Submit update playlist form succeed with invalid data, submitted data : ${values.toString()}`,
                  ),
                );
                return;
              }

              updatePlaylist({
                organization: values.organizationId,
                title: values.name,
              });
            }}
            submitTitle={intl.formatMessage(messages.saveButtonTitle)}
            isSubmitting={isSubmitting}
          />
        </Box>
      </WhiteCard>

      <WhiteCard height={{ min: 'auto' }}>
        <Heading level={4}>{intl.formatMessage(messages.accessTitle)}</Heading>
        <AddUserAccessButton
          playlistId={params.id}
          excludedUsers={playlist.users}
        />
        <PlaylistUserList playlistId={params.id} />
      </WhiteCard>
    </Box>
  );
};
