import { DataGrid, SortModel, usePagination } from '@openfun/cunningham-react';
import { Box, Button } from 'grommet';
import { BoxLoader, Heading, PortabilityRequest, Text } from 'lib-components';
import { useEffect, useMemo, useState } from 'react';
import { IntlShape, defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { WhiteCard } from 'components/Cards';
import { ITEM_PER_PAGE } from 'conf/global';

import { usePortabilityRequests } from '../api/usePortabilityRequests';
import { useLtiUserAssociationJwtQueryParam } from '../hooks/useLtiUserAssociationJwtQueryParam';

import { AcceptRejectButtons } from './AcceptRejectButtons';
import { PortabilityRequestStateTag } from './PortabilityRequestStateTag';

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
  requestFromLtiUser: {
    defaultMessage: 'Made by LTI user',
    description:
      'Value displayed in the table when the request is from an LTI user',
    id: 'features.PortabilityRequests.requestFromLtiUser',
  },
  rowPortabilityRequestText: {
    defaultMessage: '{from_playlist} wants access to {for_playlist}',
    description:
      'Row text displayed in the table to display the playlists involved in the request',
    id: 'features.PortabilityRequests.rowPlaylistText',
  },
  columnNameCreatedOn: {
    defaultMessage: 'Created On',
    description:
      'The column name "Created On" on the portability request datagrid.',
    id: 'features.PortabilityRequests.columnNameCreatedOn',
  },
  columnNamePortabilityRequest: {
    defaultMessage: 'Portability Request',
    description:
      'The column name "Portability Request" on the portability request datagrid.',
    id: 'features.PortabilityRequests.columnNamePortabilityRequest',
  },
  columnNameConsumerSite: {
    defaultMessage: 'Consumer Site',
    description:
      'The column name "Consumer Site" on the portability request datagrid.',
    id: 'features.PortabilityRequests.columnNameConsumerSite',
  },
  columnNameFromUserEmail: {
    defaultMessage: 'From user email',
    description:
      'The column name "From user email" on the portability request datagrid.',
    id: 'features.PortabilityRequests.columnNameFromUserEmail',
  },
  columnNameUpdatedUserEmail: {
    defaultMessage: 'Updated user email',
    description:
      'The column name "Updated user email" on the portability request datagrid.',
    id: 'features.PortabilityRequests.columnNameUpdatedUserEmail',
  },
  columnNameStatus: {
    defaultMessage: 'Status',
    description:
      'The column name "Status" on the portability request datagrid.',
    id: 'features.PortabilityRequests.columnNameStatus',
  },
  columnNameActions: {
    defaultMessage: 'Actions',
    description:
      'The column name "Actions" on the portability request datagrid.',
    id: 'features.PortabilityRequests.columnNameActions',
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
const cleanupPortabilityRequest = (
  portabilityRequests: PortabilityRequest[] | undefined,
  intl: IntlShape,
) =>
  portabilityRequests
    ? portabilityRequests.map((portabilityRequest) => ({
        id: portabilityRequest.id,
        created_on: `${new Date(
          portabilityRequest.created_on,
        ).toLocaleDateString(navigator.language)} ${new Date(
          portabilityRequest.created_on,
        ).toLocaleTimeString(navigator.language)}`,
        portabilityRequest: intl.formatMessage(
          messages.rowPortabilityRequestText,
          {
            from_playlist: portabilityRequest.from_playlist.title,
            for_playlist: portabilityRequest.for_playlist.title,
          },
        ),
        consumerSite: portabilityRequest.from_lti_consumer_site?.name,
        fromUserEmail:
          portabilityRequest?.from_user?.email ||
          intl.formatMessage(messages.requestFromLtiUser),
        updatedUserEmail: portabilityRequest?.updated_by_user?.email,
        state: portabilityRequest.state,
        can_accept_or_reject: portabilityRequest.can_accept_or_reject,
      }))
    : [];

interface PortabilityRequestsProps {
  state?: string;
  for_playlist_id?: string;
}

export const PortabilityRequests = ({
  state,
  for_playlist_id,
}: PortabilityRequestsProps) => {
  const intl = useIntl();

  const pagination = usePagination({
    defaultPage: 1,
    pageSize: ITEM_PER_PAGE,
  });

  const { page, pageSize, setPagesCount } = pagination;

  const [sortModel, setSortModel] = useState<SortModel>([
    {
      field: 'created_on',
      sort: 'desc',
    },
  ]);

  let ordering = '';
  if (sortModel.length) {
    ordering = sortModel[0].field;
    if (sortModel[0].sort === 'desc') {
      ordering = `-${ordering}`;
    }
  }

  const { isError, isLoading, data, refetch, isFetching } =
    usePortabilityRequests({
      offset: `${(page - 1) * ITEM_PER_PAGE}`,
      limit: `${ITEM_PER_PAGE}`,
      ordering,
      state, // disable filter by default
      for_playlist_id, // disable filter by default
    });

  useLtiUserAssociationJwtQueryParam();

  useEffect(() => {
    setPagesCount(data?.count ? Math.ceil(data?.count / pageSize) : 0);
  }, [data?.count, pageSize, setPagesCount]);

  const hasNoResult = !isError && data && !data?.count && !isLoading;
  const hasResult = !isError && data && data?.count && !isLoading;

  const rows = useMemo(
    () => cleanupPortabilityRequest(data?.results, intl),
    [data?.results, intl],
  );

  return (
    <Box pad="medium">
      <WhiteCard direction="column">
        <Box flex="shrink" direction="row">
          <Box flex>
            <Heading level={2}>{intl.formatMessage(messages.title)}</Heading>
          </Box>
        </Box>
        {isLoading && <BoxLoader />}
        {isError && (
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
        {hasNoResult && (
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
        )}
        {hasResult && (
          <BoxDatagrid>
            <DataGrid
              columns={[
                {
                  field: 'created_on',
                  headerName: intl.formatMessage(messages.columnNameCreatedOn),
                },
                {
                  field: 'portabilityRequest',
                  enableSorting: false,
                  headerName: intl.formatMessage(
                    messages.columnNamePortabilityRequest,
                  ),
                },
                {
                  field: 'consumerSite',
                  enableSorting: false,
                  headerName: intl.formatMessage(
                    messages.columnNameConsumerSite,
                  ),
                },
                {
                  field: 'fromUserEmail',
                  enableSorting: false,
                  headerName: intl.formatMessage(
                    messages.columnNameFromUserEmail,
                  ),
                },
                {
                  field: 'updatedUserEmail',
                  enableSorting: false,
                  headerName: intl.formatMessage(
                    messages.columnNameUpdatedUserEmail,
                  ),
                },
                {
                  id: 'portability-request-column-state',
                  headerName: intl.formatMessage(messages.columnNameStatus),
                  renderCell: ({ row: portabilityRequest }) => (
                    <PortabilityRequestStateTag
                      state={portabilityRequest.state}
                    />
                  ),
                },
                {
                  id: 'portability-request-column-actions',
                  headerName: intl.formatMessage(messages.columnNameActions),
                  renderCell: ({ row: portabilityRequest }) => (
                    <AcceptRejectButtons
                      portabilityRequestId={portabilityRequest.id}
                      canAcceptOrReject={
                        portabilityRequest.can_accept_or_reject
                      }
                    />
                  ),
                },
              ]}
              rows={rows}
              pagination={pagination}
              isLoading={isLoading || isFetching}
              sortModel={sortModel}
              onSortModelChange={setSortModel}
            />
          </BoxDatagrid>
        )}
      </WhiteCard>
    </Box>
  );
};
