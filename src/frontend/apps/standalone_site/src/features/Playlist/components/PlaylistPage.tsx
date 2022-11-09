import { Box, Button, Heading, Text } from 'grommet';
import { Spinner } from 'lib-components';
import { Fragment, useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { ReactComponent as CheckListIcon } from 'assets/svg/iko_checklistsvg.svg';
import { WhiteCard } from 'components/Cards';
import { SortableTable } from 'components/SortableTable';
import { ITEM_PER_PAGE } from 'conf/global';

import { PlaylistOrderType, usePlaylists } from '../api/usePlaylists';

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
  sortByCreateOn: {
    defaultMessage: 'Creation date',
    description: 'Button title to sort by creation date.',
    id: 'features.Playlist.sortByCreateOn',
  },
  sortByTitle: {
    defaultMessage: 'Title',
    description: 'Button title to sort by title.',
    id: 'features.Playlist.sortByTitle',
  },
  reversedSort: {
    defaultMessage: '(reversed)',
    description: 'Indicator to show current selection is reversed.',
    id: 'features.Playlist.reversedSort',
  },
});

export const PlaylistPage = () => {
  const intl = useIntl();

  const sorts = [
    {
      label: intl.formatMessage(messages.sortByCreateOn),
      value: PlaylistOrderType.BY_CREATED_ON,
    },
    {
      label: `${intl.formatMessage(
        messages.sortByCreateOn,
      )} ${intl.formatMessage(messages.reversedSort)}`,
      value: PlaylistOrderType.BY_CREATED_ON_REVERSED,
    },
    {
      label: intl.formatMessage(messages.sortByTitle),
      value: PlaylistOrderType.BY_TITLE,
    },
    {
      label: `${intl.formatMessage(messages.sortByTitle)} ${intl.formatMessage(
        messages.reversedSort,
      )}`,
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

  const shouldDisplayCreateButton = hasLoadedOnce && data && data.count > 0;
  const shouldDisplayError = (!isLoading && !data) || isError;
  const shouldDisplayNoPlaylistYetMessage =
    !isError && data && data.count === 0; // we dont want to show create button and no playlist yet message at the same time
  const shouldDisplayTable = !isError && data && data.count > 0;

  return (
    <Box pad="medium">
      <WhiteCard direction="column">
        <Box flex="shrink" direction="row">
          <Box flex>
            <Heading level={3} truncate>
              {intl.formatMessage(messages.title)}
            </Heading>
          </Box>
          {shouldDisplayCreateButton && (
            <Box flex="shrink" margin={{ vertical: 'auto', left: 'small' }}>
              <Button primary a11yTitle={intl.formatMessage(messages.create)}>
                {intl.formatMessage(messages.create)}
              </Button>
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
                  >
                    {intl.formatMessage(messages.retry)}
                  </Button>
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
                  <Button primary>{intl.formatMessage(messages.create)}</Button>
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
                selectable
                onSelectionChange={(items) => {
                  console.log('new selection', items);
                }}
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
                  <Box flex direction="row" align="center">
                    <Box basis="30%">{item.title}</Box>
                    <Box basis="50%">{item.lti_id}</Box>
                    <Box basis="20%">{item.consumer_site.domain}</Box>
                  </Box>
                )}
              </SortableTable>
            )}
          </Fragment>
        )}
      </WhiteCard>
    </Box>
  );
};
