import { Select } from 'grommet';
import { Playlist, FormField } from 'lib-components';
import { useState, useEffect, useMemo } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { ITEM_PER_PAGE } from 'conf/global';

import { PlaylistOrderType, usePlaylists } from '../api/usePlaylists';

const messages = defineMessages({
  selectPlaylistLabel: {
    defaultMessage: 'Choose the playlist.',
    description: 'Label select playlist.',
    id: 'features.Contents.features.Video.VideoCreateForm.selectPlaylistLabel',
  },
});

const useSelectPlaylist = (onSuccess: (playlists: Playlist[]) => void) => {
  const intl = useIntl();
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
        onSuccess(data.results);
      },
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
    ),
    [intl, playlistResponse, playlists],
  );

  return {
    errorPlaylist,
    selectPlaylist,
  };
};

export default useSelectPlaylist;
