import { Box, Button, Heading, Text } from 'grommet';
import { Spinner } from 'lib-components';
import { Fragment, useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Route, Switch, useHistory } from 'react-router-dom';

import { ReactComponent as CheckListIcon } from 'assets/svg/iko_checklistsvg.svg';
import { WhiteCard } from 'components/Cards';
import { Modal } from 'components/Modal';
import { commonSortMessages, SortableTable } from 'components/SortableTable';
import { ITEM_PER_PAGE } from 'conf/global';
import { CREATE_PLAYLIST_MODALE, routes } from 'routes';

import { PlaylistOrderType, usePlaylists } from '../api/usePlaylists';

import { CreatePlaylistForm } from './CreatePlaylistForm';

const messages = defineMessages({
  title: {
    defaultMessage: 'My Playlists',
    description: 'Playlist page title',
    id: 'features.Playlist.title',
  },
  create: {
    defaultMessage: 'Create playlist',
    description: 'Create playlist button title',
    id: 'features.Playlist.create',
  },
  noPlaylists: {
    defaultMessage: 'You have no playlist yet.',
    description: 'Message displayed when the user has not playlist yet.',
    id: 'features.Playlist.noPlaylists',
  },
  tableTitle: {
    defaultMessage:
      '{item_count, plural, =0 {no playlist} one {# playlist} other {# playlists}}',
    description: 'Playlist table title.',
    id: 'features.Playlist.tableTitle',
  },
  error: {
    defaultMessage: 'An error occurred, please try again later.',
    description: 'Error message on loading playlists',
    id: 'features.Playlist.error',
  },
  retry: {
    defaultMessage: 'Retry',
    description: 'Retry button title',
    id: 'features.Playlist.retry',
  },
  updatePlaylist: {
    defaultMessage: 'Update playlist {playlistName}',
    description: 'Message for update playlist button.',
    id: 'features.Playlist.updatePlaylist',
  },
});

export const PlaylistPage = () => {
  const intl = useIntl();
  const history = useHistory();

  const sorts = [
    {
      label: intl.formatMessage(commonSortMessages.sortByAscendingCreationDate),
      value: PlaylistOrderType.BY_CREATED_ON,
    },
    {
      label: intl.formatMessage(
        commonSortMessages.sortByDescendingCreationDate,
      ),
      value: PlaylistOrderType.BY_CREATED_ON_REVERSED,
    },
    {
      label: intl.formatMessage(commonSortMessages.sortByAscendingTitle),
      value: PlaylistOrderType.BY_TITLE,
    },
    {
      label: intl.formatMessage(commonSortMessages.sortByDescendingTitle),
      value: PlaylistOrderType.BY_TITLE_REVERSED,
    },
  ];

  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [currentSort, setCurrentSort] = useState(sorts[1]);
  const [currentPage, setCurrentPage] = useState(1);
  const { isError, isLoading, data, refetch } = usePlaylists({
    offset: `${(currentPage - 1) * ITEM_PER_PAGE}`,
    limit: `${ITEM_PER_PAGE}`,
    ordering: currentSort.value,
  });

  useEffect(() => {
    if (!isLoading) {
      setHasLoadedOnce(true);
    }
  }, [isLoading]);

  const [shouldDisplayActions, setShouldDisplayActions] = useState(false);
  useEffect(() => {
    if (!shouldDisplayActions && data?.count && hasLoadedOnce) {
      setShouldDisplayActions(true);
    }
  }, [hasLoadedOnce, data?.count, shouldDisplayActions]);

  const shouldDisplayError = (!isLoading && !data) || isError;
  const shouldDisplayNoPlaylistYetMessage =
    !isError && data && data.count === 0; // we dont want to show create button and no playlist yet message at the same time
  const shouldDisplayTable = !isError && data && data.count > 0;

  return (
    <Fragment>
      <Switch>
        <Route path={CREATE_PLAYLIST_MODALE}>
          <Modal
            isOpen
            onClose={() => {
              history.push(routes.PLAYLIST.path);
            }}
          >
            <CreatePlaylistForm />
          </Modal>
        </Route>
      </Switch>

      <Box pad="medium">
        <WhiteCard direction="column">
          <Box flex="shrink" direction="row">
            <Box flex>
              <Heading level={3} truncate>
                {intl.formatMessage(messages.title)}
              </Heading>
            </Box>
            {shouldDisplayActions && (
              <Box
                flex="shrink"
                margin={{ vertical: 'auto', left: 'small' }}
                gap="small"
                direction="row"
              >
                <Button
                  primary
                  a11yTitle={intl.formatMessage(messages.create)}
                  onClick={() => {
                    history.push(CREATE_PLAYLIST_MODALE);
                  }}
                  label={intl.formatMessage(messages.create)}
                />
              </Box>
            )}
          </Box>
          {!hasLoadedOnce && <Spinner />}
          {hasLoadedOnce && (
            <Fragment>
              {shouldDisplayError && (
                <Box
                  background="content-background"
                  margin="auto"
                  pad="medium"
                  round="small"
                >
                  <Text size="large">{intl.formatMessage(messages.error)}</Text>
                  <Box margin={{ horizontal: 'auto', top: 'medium' }}>
                    <Button
                      a11yTitle={intl.formatMessage(messages.retry)}
                      onClick={() => {
                        refetch();
                      }}
                      primary
                      label={intl.formatMessage(messages.retry)}
                    />
                  </Box>
                </Box>
              )}
              {shouldDisplayNoPlaylistYetMessage && (
                <Box
                  background="content-background"
                  margin="auto"
                  pad="medium"
                  round="small"
                >
                  <Text size="large">
                    {intl.formatMessage(messages.noPlaylists)}
                  </Text>
                  <Box margin={{ horizontal: 'auto', top: 'medium' }}>
                    <Button
                      primary
                      onClick={() => {
                        history.push(CREATE_PLAYLIST_MODALE);
                      }}
                      label={intl.formatMessage(messages.create)}
                    />
                  </Box>
                </Box>
              )}
              {shouldDisplayTable && (
                <SortableTable
                  loading={isLoading}
                  title={
                    <Box direction="row">
                      <CheckListIcon width={30} height={30} />
                      <Text margin={{ left: 'small' }}>
                        {intl.formatMessage(messages.tableTitle, {
                          item_count: data.count,
                        })}
                      </Text>
                    </Box>
                  }
                  items={data.results}
                  sortable
                  sortBy={sorts}
                  currentSort={currentSort}
                  onSortChange={(newSort) => {
                    setCurrentSort(newSort);
                    return data.results;
                  }}
                  paginable
                  numberOfItems={data.count}
                  pageSize={ITEM_PER_PAGE}
                  onPageChange={(newPage) => {
                    setCurrentPage(newPage);
                    return data.results;
                  }}
                >
                  {(item) => (
                    <Button
                      plain
                      a11yTitle={intl.formatMessage(messages.updatePlaylist, {
                        playlistName: item.title,
                      })}
                      title={intl.formatMessage(messages.updatePlaylist, {
                        playlistName: item.title,
                      })}
                      label={
                        <Box flex>
                          <Text wordBreak="break-word">{item.title}</Text>
                        </Box>
                      }
                      onClick={() => {
                        history.push(`/my-playlists/${item.id}/update`);
                      }}
                    />
                  )}
                </SortableTable>
              )}
            </Fragment>
          )}
        </WhiteCard>
      </Box>
    </Fragment>
  );
};
