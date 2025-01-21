import { Button, Input, Loader } from '@openfun/cunningham-react';
import { AddCircle, Trash } from 'grommet-icons';
import { colorsTokens } from 'lib-common';
import {
  Box,
  BoxError,
  CopyClipboard,
  Document,
  ErrorComponents,
  ErrorMessage,
  List,
  Playlist,
  Text,
  Video,
} from 'lib-components';
import React, { Fragment, JSX, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';

import { usePlaylist, useUpdatePlaylist } from '../../data/queries';

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
      'Sharing this playlist will grant access to all these resources.',
    description: 'Helper text to explain what sharing will do.',
    id: 'component.PlaylistPortability.shareWithPlaylistDetails',
  },
  shareWithPlaylistPlaceholder: {
    defaultMessage: 'Paste playlist id',
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
  addPortability: {
    defaultMessage: 'add share',
    description: 'Accessible message for adding a portability.',
    id: 'component.PlaylistPortability.addPortability',
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
  copy: {
    defaultMessage: 'Copy key {text}.',
    description: 'Accessible message for copying a playlist id.',
    id: 'components.PlaylistPortability.copy',
  },
});

interface PlaylistPortabilityListProps {
  playlist: Playlist;
  removePlaylistPortability: (oldPortabilityID: string) => void;
}

export const PlaylistPortabilityList = ({
  playlist,
  removePlaylistPortability,
}: PlaylistPortabilityListProps) => {
  const intl = useIntl();
  if (playlist.portable_to.length > 0) {
    return (
      <Box>
        <Text>
          <FormattedMessage {...messages.sharedListTitle} />
        </Text>
        <List
          data={playlist.portable_to as { title: string; id: string }[]}
          pad={{ left: 'small', right: 'none' }}
          action={(item, index) => (
            <Button
              color="tertiary"
              aria-label={intl.formatMessage(messages.removePortability, {
                title: item.title,
              })}
              key={index}
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
              aria-label={intl.formatMessage(
                messages.hasPortabilityWith,
                reachableFromPlaylist,
              )}
              direction="row"
              gap="medium"
              align="center"
              pad="small"
            >
              <Text weight="bold">{reachableFromPlaylist.title}</Text>
              <Text size="small" color="clr-primary-800">
                {reachableFromPlaylist.id}
              </Text>
            </Box>
          )}
        </List>
      </Box>
    );
  }
  return null;
};

interface PlaylistPortabilityProps {
  object: Video | Document;
}

export const PlaylistPortability = ({ object }: PlaylistPortabilityProps) => {
  const intl = useIntl();
  const [newPortabilityID, setNewPortabilityID] = useState('');

  const {
    data: playlist,
    status: usePlaylistStatus,
    fetchStatus: usePlaylistFetchStatus,
  } = usePlaylist(object.playlist.id);

  const mutation = useUpdatePlaylist(object.playlist.id, {
    onSuccess: () => {
      toast.success(intl.formatMessage(messages.updatePlaylistSuccess));
    },
    onError: () => {
      toast.error(intl.formatMessage(messages.updatePlaylistFail));
    },
  });

  const addPlaylistPortability = () => {
    mutation.mutate({
      portable_to: playlist?.portable_to
        .map((portedToPlaylist) => {
          return portedToPlaylist.id;
        })
        .concat(newPortabilityID),
    });
    setNewPortabilityID('');
  };

  const removePlaylistPortability = (oldPortabilityID: string) => {
    mutation.mutate({
      portable_to: playlist?.portable_to
        .filter((portedToPlaylist) => portedToPlaylist.id !== oldPortabilityID)
        .map((portedToPlaylist) => portedToPlaylist.id),
    });
  };

  let content: JSX.Element = <Fragment></Fragment>;
  if (usePlaylistStatus === 'error') {
    content = <ErrorMessage code={ErrorComponents.generic} />;
  } else if (usePlaylistStatus === 'success') {
    content = (
      <React.Fragment>
        <Box align="center" direction="row" pad={{ top: 'small' }}>
          <Text role="heading" className="m-s">
            <CopyClipboard
              copyId={`playlist-${playlist?.id}`}
              text={
                <FormattedMessage
                  {...messages.playlistTitle}
                  values={{ title: playlist?.title, id: playlist?.id }}
                />
              }
              textToCopy={playlist?.id}
              title={intl.formatMessage(messages.copy, {
                text: playlist?.id,
              })}
              onSuccess={(event) => {
                toast.success(
                  intl.formatMessage(messages.copied, { text: event.text }),
                );
              }}
              onError={(event) => {
                toast.error(event.text);
              }}
            />
          </Text>
        </Box>

        <Box width="large">
          <PlaylistPortabilityList
            playlist={playlist}
            removePlaylistPortability={removePlaylistPortability}
          />
          <Box>
            <Input
              aria-label={intl.formatMessage(
                messages.shareWithPlaylistPlaceholder,
              )}
              label={intl.formatMessage(messages.shareWithPlaylist)}
              id="port-to-playlist-uuid"
              fullWidth
              onChange={(event) => setNewPortabilityID(event.target.value)}
              value={newPortabilityID}
              rightIcon={
                <AddCircle
                  aria-label={intl.formatMessage(messages.addPortability)}
                  onClick={addPlaylistPortability}
                  color={colorsTokens['info-500']}
                  style={{ cursor: 'pointer' }}
                  role="button"
                />
              }
            />
          </Box>

          <BoxError
            message={intl.formatMessage(messages.shareWithPlaylistDetails)}
            margin={{ top: 'medium' }}
          />
        </Box>
      </React.Fragment>
    );
  } else if (
    usePlaylistFetchStatus === 'idle' ||
    usePlaylistStatus === 'loading'
  ) {
    content = (
      <Loader aria-label={intl.formatMessage(messages.loadingPlaylist)} />
    );
  }

  return (
    <Box align="center" pad={{ top: 'small' }}>
      {content}
    </Box>
  );
};
