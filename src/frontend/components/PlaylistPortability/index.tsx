import {
  Box,
  Button,
  Form,
  FormField,
  List,
  Spinner,
  Text,
  TextInput,
} from 'grommet';
import { AddCircle, Copy, Trash } from 'grommet-icons';
import React, { useEffect } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { usePlaylist, useUpdatePlaylist } from '../../data/queries';
import { ErrorMessage } from '../ErrorComponents';
import { LTINav } from '../LTINav';
import { Video } from '../../types/tracks';
import { Document } from '../../types/file';
import { DashboardContainer } from '../Dashboard';
import ClipboardJS from 'clipboard';
import { toast } from 'react-hot-toast';

const messages = defineMessages({
  loadingPlaylist: {
    defaultMessage: 'Loading playlist...',
    description:
      'Accessible message for the spinner while loading the playlist in dashboard view.',
    id: 'component.PlaylistPortability.loadingPlaylist',
  },
  playlistTitle: {
    defaultMessage: 'Belongs to playlist {title} ({id})',
    description: 'Title for the current playlist.',
    id: 'component.PlaylistPortability.playlistTitle',
  },
  sharedListTitle: {
    defaultMessage: 'Playlist shared with:',
    description: '',
    id: 'component.PlaylistPortability.sharedListTitle',
  },
  shareWithPlaylist: {
    defaultMessage: 'Share with another playlist',
    description: 'Input label for adding a new portability.',
    id: 'component.PlaylistPortability.shareWithPlaylist',
  },
  shareWithPlaylistDetails: {
    defaultMessage:
      'Sharing this playlist will grant access to all this resources.',
    description: 'Helper text to explain what sharing will do.',
    id: 'component.PlaylistPortability.shareWithPlaylistDetails',
  },
  shareWithPlaylistPlaceholder: {
    defaultMessage: 'Paste playlist uuid',
    description: 'Helper text for adding a new portability.',
    id: 'component.PlaylistPortability.shareWithPlaylistPlaceholder',
  },
  updatePlaylistSuccess: {
    defaultMessage: 'Playlist updated.',
    description: 'Message when playlist update is successful.',
    id: 'component.PlaylistPortability.updatePlaylistSuccess',
  },
  updatePlaylistFail: {
    defaultMessage: 'Playlist not updated!',
    description: 'Message when playlist update failed.',
    id: 'component.PlaylistPortability.updatePlaylistFail',
  },
  removePortability: {
    defaultMessage: 'Delete sharing with {title}',
    description: 'Accessible message for removing a portability.',
    id: 'component.PlaylistPortability.removePortability',
  },
  hasPortabilityWith: {
    defaultMessage: 'Shared with {title}',
    description:
      'Accessible message for displaying a portability with a playlist.',
    id: 'component.PlaylistPortability.hasPortabilityWith',
  },
  copied: {
    defaultMessage: '{text} copied!',
    description: 'Message displayed when playlist info are copied.',
    id: 'components.PlaylistPortability.copied',
  },
});

interface PlaylistPortabilityProps {
  object: Video | Document;
}

export const PlaylistPortability = ({ object }: PlaylistPortabilityProps) => {
  const intl = useIntl();
  const [newPortabilityID, setNewPortabilityID] = React.useState('');

  const { data, status } = usePlaylist(object.playlist.id);
  const playlist = data;
  const usePlaylistStatus = status;

  useEffect(() => {
    const clipboard = new ClipboardJS('.copy');
    clipboard.on('success', (event) => {
      toast.success(intl.formatMessage(messages.copied, { text: event.text }));
    });

    clipboard.on('error', (event) => {
      toast.error(event.text);
    });

    return () => clipboard.destroy();
  }, []);

  const mutation = useUpdatePlaylist(object.playlist.id, {
    onSuccess: () => {
      toast.success(intl.formatMessage(messages.updatePlaylistSuccess));
    },
    onError: () => {
      toast.error(intl.formatMessage(messages.updatePlaylistFail));
    },
  });

  let content: JSX.Element;
  switch (usePlaylistStatus) {
    case 'idle':
    case 'loading':
      content = (
        <Spinner size="large">
          <FormattedMessage {...messages.loadingPlaylist} />
        </Spinner>
      );
      break;

    case 'error':
      content = <ErrorMessage code="generic" />;
      break;

    case 'success':
      function addPlaylistPortability() {
        mutation.mutate({
          portable_to: playlist?.portable_to
            .map((portedToPlaylist) => {
              return portedToPlaylist.id;
            })
            .concat(newPortabilityID),
        });
        setNewPortabilityID('');
      }

      function removePlaylistPortability(oldPortabilityID: string) {
        mutation.mutate({
          portable_to: playlist?.portable_to
            .filter(
              (portedToPlaylist) => portedToPlaylist.id !== oldPortabilityID,
            )
            .map((portedToPlaylist) => portedToPlaylist.id),
        });
      }

      let portabilityList: JSX.Element = <React.Fragment />;
      if (playlist!.portable_to.length > 0) {
        portabilityList = (
          <Box>
            <Text>
              <FormattedMessage {...messages.sharedListTitle} />
            </Text>
            <List
              data={playlist?.portable_to}
              pad={{ left: 'small', right: 'none' }}
              action={(item, index) => (
                <Button
                  aria-label={intl.formatMessage(
                    messages.removePortability,
                    item,
                  )}
                  key={index}
                  plain
                  icon={<Trash />}
                  onClick={() => {
                    removePlaylistPortability(item.id);
                  }}
                />
              )}
            >
              {(reachableFromPlaylist: { title: string; id: string }) => (
                <Box
                  role="listitem"
                  a11yTitle={intl.formatMessage(
                    messages.hasPortabilityWith,
                    reachableFromPlaylist,
                  )}
                  direction="row-responsive"
                  gap="medium"
                  align="center"
                >
                  <Text weight="bold">{reachableFromPlaylist.title}</Text>
                  <Text size="small" color="dark-4">
                    {reachableFromPlaylist.id}
                  </Text>
                </Box>
              )}
            </List>
          </Box>
        );
      }

      content = (
        <React.Fragment>
          <Box align="center" direction="row" pad={{ top: 'small' }}>
            <Text role="heading" margin="small">
              <FormattedMessage
                {...messages.playlistTitle}
                values={{ title: playlist?.title, id: playlist?.id }}
              />
              <Button
                aria-label={`copy key ${playlist?.id}`}
                data-clipboard-text={playlist?.id}
                icon={<Copy />}
                className="copy"
              />
            </Text>
          </Box>

          <Box width="large">
            {portabilityList}
            <Box>
              <Form onSubmit={addPlaylistPortability}>
                <FormField
                  label={<FormattedMessage {...messages.shareWithPlaylist} />}
                  htmlFor="port-to-playlist-uuid"
                >
                  <Box direction="row">
                    <TextInput
                      placeholder={intl.formatMessage(
                        messages.shareWithPlaylistPlaceholder,
                      )}
                      id="port-to-playlist-uuid"
                      onChange={(event) =>
                        setNewPortabilityID(event.target.value)
                      }
                      value={newPortabilityID}
                      plain
                    />
                    <Button
                      type="submit"
                      aria-label="add share"
                      icon={<AddCircle />}
                    />
                  </Box>
                </FormField>
              </Form>
            </Box>

            <Box
              align="center"
              margin={{ top: 'medium' }}
              pad="small"
              background="status-warning"
              width="large"
            >
              <Text>
                <FormattedMessage {...messages.shareWithPlaylistDetails} />
              </Text>
            </Box>
          </Box>
        </React.Fragment>
      );
      break;
  }

  return (
    <DashboardContainer>
      <LTINav object={object} />
      <Box align="center" pad={{ top: 'small' }}>
        {content}
      </Box>
    </DashboardContainer>
  );
};
