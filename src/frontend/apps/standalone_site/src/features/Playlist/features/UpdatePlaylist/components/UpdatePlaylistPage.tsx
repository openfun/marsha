import { Box, BoxLoader, Heading, report } from 'lib-components';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { WhiteCard } from 'components/Cards';
import { Contents } from 'features/Contents/';
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

interface UpdatePlaylistPageProps {
  playlistId: string;
}

export const UpdatePlaylistPage = ({ playlistId }: UpdatePlaylistPageProps) => {
  const intl = useIntl();
  const { data: playlist, isLoading } = usePlaylist(playlistId);
  const { mutate: updatePlaylist, isLoading: isSubmitting } = useUpdatePlaylist(
    playlistId,
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
    return <BoxLoader />;
  }

  return (
    <Box gap="medium">
      <WhiteCard height={{ min: 'auto' }} pad="medium">
        <Heading level={2} style={{ marginTop: '0' }}>
          {intl.formatMessage(messages.mainInfoTitle)}
        </Heading>
        <Box
          width={{ max: 'full', width: 'large' }}
          margin={{ horizontal: 'auto' }}
        >
          <PlaylistForm
            initialValues={{
              name: playlist.title,
              organizationId: playlist.organization?.id,
              retention_duration: playlist.retention_duration,
            }}
            isEditable={!isSubmitting}
            onSubmit={(values) => {
              if (!values.name || !values.organizationId) {
                //  should not happen with validation.
                report(
                  new Error(
                    `Submit update playlist form succeed with invalid data, submitted data : ${JSON.stringify(
                      values,
                    )}`,
                  ),
                );
                return;
              }

              updatePlaylist({
                organization: values.organizationId,
                title: values.name,
                retention_duration: values.retention_duration || null,
              });
            }}
            submitTitle={intl.formatMessage(messages.saveButtonTitle)}
            isSubmitting={isSubmitting}
            playlistId={playlistId}
          />
        </Box>
      </WhiteCard>

      <WhiteCard height={{ min: 'auto' }} pad="medium">
        <Box
          justify="space-between"
          direction="row"
          align="center"
          margin={{ bottom: 'small' }}
        >
          <Heading level={2} style={{ margin: '0' }}>
            {intl.formatMessage(messages.accessTitle)}
          </Heading>
          <AddUserAccessButton
            playlistId={playlistId}
            excludedUsers={playlist.users}
          />
        </Box>
        <PlaylistUserList playlistId={playlistId} />
      </WhiteCard>
      <Contents playlistId={playlistId} />
    </Box>
  );
};
