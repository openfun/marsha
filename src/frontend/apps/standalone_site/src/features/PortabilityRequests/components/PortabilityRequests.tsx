import { Box, Button, Heading, Text } from 'grommet';
import { Spinner } from 'lib-components';
import { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { ReactComponent as CheckListIcon } from 'assets/svg/iko_checklistsvg.svg';
import { WhiteCard } from 'components/Cards';
import { SortableTable, commonSortMessages } from 'components/SortableTable';
import { ITEM_PER_PAGE } from 'conf/global';

import { usePortabilityRequests } from '../api/usePortabilityRequests';
import { useLtiUserAssociationJwtQueryParam } from '../hooks/useLtiUserAssociationJwtQueryParam';

import { ItemTableRow } from './ItemTableRow';

const messages = defineMessages({
  title: {
    defaultMessage: 'Portability requests',
    description: 'PortabilityRequests title',
    id: 'features.PortabilityRequests.title',
  },
  noPortabilityRequest: {
    defaultMessage: 'You have no portability request yet.',
    description:
      'Message displayed when there is no portability request to display',
    id: 'features.PortabilityRequests.noPortabilityRequest',
  },
  tableTitle: {
    defaultMessage:
      '{item_count, plural, =0 {no portability request} one {# portability request} other {# portability requests}}',
    description: 'Portability requests table title.',
    id: 'features.PortabilityRequests.tableTitle',
  },
  error: {
    defaultMessage: 'An error occurred, please try again later.',
    description: 'Error message on loading portability requests',
    id: 'features.PortabilityRequests.error',
  },
  retry: {
    defaultMessage: 'Retry',
    description: 'Retry button title',
    id: 'features.PortabilityRequests.retry',
  },
});

interface PortabilityRequestsProps {
  state?: string;
  for_playlist_id?: string;
}

export const PortabilityRequests = ({
  state,
  for_playlist_id,
}: PortabilityRequestsProps) => {
  const intl = useIntl();

  const sorts = [
    {
      id: '-created_on',
      label: intl.formatMessage(
        commonSortMessages.sortByDescendingCreationDate,
      ),
    },
    {
      id: 'created_on',
      label: intl.formatMessage(commonSortMessages.sortByAscendingCreationDate),
    },
  ];

  const [currentSort, setCurrentSort] = useState(sorts[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const { isError, isLoading, data, refetch } = usePortabilityRequests({
    offset: `${(currentPage - 1) * ITEM_PER_PAGE}`,
    limit: `${ITEM_PER_PAGE}`,
    ordering: currentSort.id,
    state: state || '', // disable filter by default
    for_playlist_id: for_playlist_id || '', // disable filter by default
  });

  useLtiUserAssociationJwtQueryParam();

  return (
    <Box pad="medium">
      <WhiteCard direction="column">
        <Box flex="shrink" direction="row">
          <Box flex>
            <Heading level={3} truncate>
              {intl.formatMessage(messages.title)}
            </Heading>
          </Box>
        </Box>
        {isLoading && <Spinner />}
        {((!isLoading && !data && !isError) || isError) && (
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
        {!isLoading &&
          !isError &&
          data &&
          (data.results.length === 0 ? (
            <Box
              background="content-background"
              margin="auto"
              pad="medium"
              round="small"
            >
              <Text size="large">
                {intl.formatMessage(messages.noPortabilityRequest)}
              </Text>
            </Box>
          ) : (
            <SortableTable
              loading={isLoading}
              title={
                <Box direction="row" align="center">
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
              currentPage={currentPage}
              onPageChange={(newPage) => {
                setCurrentPage(newPage);
                return data.results;
              }}
            >
              {(item) => <ItemTableRow item={item} />}
            </SortableTable>
          ))}
      </WhiteCard>
    </Box>
  );
};
