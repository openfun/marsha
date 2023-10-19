import {
  Box,
  FormField,
  FormFieldExtendedProps,
  Select,
  SelectExtendedProps,
} from 'grommet';
import { Playlist, PlusSVG } from 'lib-components';
import { useEffect, useMemo, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import { ITEM_PER_PAGE } from 'conf/global';
import { routes } from 'routes';

import { PlaylistOrderType, usePlaylists } from '../api/usePlaylists';

const messages = defineMessages({
  selectPlaylistLabel: {
    defaultMessage: 'Choose the playlist.',
    description: 'Label select playlist.',
    id: 'features.Playlist.hooks.useSelectPlaylist.selectPlaylistLabel',
  },
  createPlaylist: {
    defaultMessage: 'Create a new playlist',
    description:
      'a11y label added to the button redirecting to the playlist creation form',
    id: 'features.Playlist.hooks.useSelectPlaylist.createPlaylist',
  },
});

interface UseSelectPlaylistOptions {
  formFieldProps?: Partial<FormFieldExtendedProps>;
  selectProps?: Partial<SelectExtendedProps>;
  withPlaylistCreation?: boolean;
}

const useSelectPlaylist = ({
  formFieldProps,
  selectProps,
  withPlaylistCreation,
}: UseSelectPlaylistOptions = {}) => {
  const intl = useIntl();
  const [currentPlaylistPage, setCurrentPlaylistPage] = useState(0);
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
    },
  );
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    if (!playlistResponse?.results) {
      return;
    }

    setPlaylists((currentPlaylists) => [
      ...currentPlaylists,
      ...playlistResponse.results,
    ]);
  }, [playlistResponse?.results]);

  const selectPlaylist = useMemo(
    () => (
      <Box
        direction="row"
        pad={withPlaylistCreation ? { bottom: 'small' } : {}}
        gap="small"
      >
        <FormField
          label={intl.formatMessage(messages.selectPlaylistLabel)}
          htmlFor="select-playlist-id"
          name="playlist"
          margin="none"
          required
          style={
            withPlaylistCreation
              ? {
                  flex: 1,
                }
              : {}
          }
          {...formFieldProps}
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
            margin="none"
            dropHeight="medium"
            {...selectProps}
          />
        </FormField>
        {withPlaylistCreation && (
          <Link
            to={routes.PLAYLIST.subRoutes.CREATE.path}
            className="ml-b mr-b"
            style={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <PlusSVG
              aria-label={intl.formatMessage(messages.createPlaylist)}
              iconColor="#055fd2"
              height="35px"
              width="35px"
            />
          </Link>
        )}
      </Box>
    ),
    [
      formFieldProps,
      intl,
      playlistResponse,
      playlists,
      selectProps,
      withPlaylistCreation,
    ],
  );

  return {
    errorPlaylist,
    selectPlaylist,
    playlistResponse,
  };
};

export default useSelectPlaylist;
