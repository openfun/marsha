import {
  Button,
  Button as ButtonCunningham,
  DataGrid,
  SortModel,
  usePagination,
} from '@openfun/cunningham-react';
import { Breakpoints, Maybe, colorsTokens } from 'lib-common';
import {
  Box,
  Heading,
  Modal,
  Playlist,
  Text,
  useResponsive,
} from 'lib-components';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Route, Routes, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { WhiteCard } from 'components/Cards';
import { ITEM_PER_PAGE } from 'conf/global';
import { routes } from 'routes';

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
  columnNameCreatedOn: {
    defaultMessage: 'Created On',
    description: 'The column name created on date on the playlist datagrid.',
    id: 'features.Playlist.columnNameCreatedOn',
  },
  columnNameTitle: {
    defaultMessage: 'Title',
    description: 'The column name title on the playlist datagrid.',
    id: 'features.Playlist.columnNameTitle',
  },
  columnNameOrganization: {
    defaultMessage: 'Organization',
    description: 'The column name organization on the playlist datagrid.',
    id: 'features.Playlist.columnNameOrganization',
  },
});

export const BoxDatagrid = styled(Box)`
  .c__datagrid {
    display: block;
    overflow: auto;
  }
  .c__datagrid td {
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }
`;

/**
 * Clean the data to be displayed in the table
 */
const cleanupPlaylist = (playlist: Playlist[] | undefined) =>
  playlist
    ? playlist.map((playlist) => ({
        id: playlist.id,
        created_on: `${new Date(playlist.created_on).toLocaleDateString(
          navigator.language,
        )} ${new Date(playlist.created_on).toLocaleTimeString(
          navigator.language,
        )}`,
        title: playlist.title,
        organization: playlist.organization?.name || '',
      }))
    : [];

export const PlaylistPage = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const { isSmallerBreakpoint, breakpoint } = useResponsive();
  const isXxsmallDevice = isSmallerBreakpoint(breakpoint, Breakpoints.xsmall);
  const playlistCreatePath = routes.PLAYLIST.subRoutes.CREATE.pathKey || '';

  const [sortModel, setSortModel] = useState<SortModel>([
    {
      field: 'created_on',
      sort: 'desc',
    },
  ]);

  const pagination = usePagination({
    defaultPage: 1,
    pageSize: ITEM_PER_PAGE,
  });

  const { page, pageSize, setPagesCount } = pagination;

  let ordering: Maybe<PlaylistOrderType>;
  if (sortModel.length) {
    ordering = sortModel[0].field as PlaylistOrderType;
    if (sortModel[0].sort === 'desc') {
      ordering = `-${ordering}` as PlaylistOrderType;
    }
  }

  const { isError, isLoading, data, refetch } = usePlaylists({
    offset: `${(page - 1) * ITEM_PER_PAGE}`,
    limit: `${ITEM_PER_PAGE}`,
    ordering,
  });

  const rows = useMemo(() => cleanupPlaylist(data?.results), [data?.results]);

  useEffect(() => {
    setPagesCount(data?.count ? Math.ceil(data?.count / pageSize) : 0);
  }, [data?.count, pageSize, setPagesCount]);

  const shouldDisplayError = (!isLoading && !data) || isError;
  const shouldDisplayNoPlaylistYetMessage =
    !isError && data && data.count === 0; // we dont want to show create button and no playlist yet message at the same time

  return (
    <Fragment>
      <Routes>
        <Route
          path={playlistCreatePath}
          element={
            <Modal
              isOpen
              onClose={() => {
                navigate('..');
              }}
            >
              <CreatePlaylistForm />
            </Modal>
          }
        />
      </Routes>

      <Box pad="medium">
        <WhiteCard direction="column" pad="medium">
          <Box
            direction={isXxsmallDevice ? 'column' : 'row'}
            align="center"
            justify="space-between"
          >
            <Heading level={2} margin={{ top: 'none' }}>
              {intl.formatMessage(messages.title)}
            </Heading>
            {!shouldDisplayNoPlaylistYetMessage && (
              <Button
                aria-label={intl.formatMessage(messages.create)}
                onClick={() => {
                  navigate(playlistCreatePath);
                }}
              >
                {intl.formatMessage(messages.create)}
              </Button>
            )}
          </Box>
          <Fragment>
            {shouldDisplayError && (
              <Box
                background={colorsTokens['info-150']}
                margin="auto"
                pad="medium"
                round="small"
              >
                <Text>{intl.formatMessage(messages.error)}</Text>
                <Box margin={{ horizontal: 'auto', top: 'medium' }}>
                  <Button
                    aria-label={intl.formatMessage(messages.retry)}
                    onClick={() => {
                      refetch();
                    }}
                  >
                    {intl.formatMessage(messages.retry)}
                  </Button>
                </Box>
              </Box>
            )}
            {shouldDisplayNoPlaylistYetMessage && (
              <Box
                background={colorsTokens['info-150']}
                margin="auto"
                pad="medium"
                round="small"
              >
                <Text>{intl.formatMessage(messages.noPlaylists)}</Text>
                <Box margin={{ horizontal: 'auto', top: 'medium' }}>
                  <Button
                    onClick={() => {
                      navigate(playlistCreatePath);
                    }}
                  >
                    {intl.formatMessage(messages.create)}
                  </Button>
                </Box>
              </Box>
            )}
            {!shouldDisplayNoPlaylistYetMessage && (
              <BoxDatagrid>
                <DataGrid
                  columns={[
                    {
                      field: 'created_on',
                      headerName: intl.formatMessage(
                        messages.columnNameCreatedOn,
                      ),
                    },
                    {
                      field: 'title',
                      headerName: intl.formatMessage(messages.columnNameTitle),
                    },
                    {
                      enableSorting: false,
                      field: 'organization',
                      headerName: intl.formatMessage(
                        messages.columnNameOrganization,
                      ),
                    },
                    {
                      id: 'column-actions',
                      renderCell: ({ row }) => (
                        <ButtonCunningham
                          color="tertiary"
                          aria-label={intl.formatMessage(
                            messages.updatePlaylist,
                            {
                              playlistName: row.title,
                            },
                          )}
                          size="small"
                          onClick={() => {
                            navigate(
                              `${routes.PLAYLIST.path}/${row.id}/update`,
                            );
                          }}
                          icon={
                            <span className="material-icons">settings</span>
                          }
                        />
                      ),
                    },
                  ]}
                  rows={rows}
                  pagination={pagination}
                  sortModel={sortModel}
                  onSortModelChange={setSortModel}
                  isLoading={isLoading}
                />
              </BoxDatagrid>
            )}
          </Fragment>
        </WhiteCard>
      </Box>
    </Fragment>
  );
};
