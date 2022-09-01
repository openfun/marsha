import { Box, Heading, Pagination, Paragraph, Select, Text } from 'grommet';
import React, { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { Loader } from 'components/Loader';

import { Maybe } from 'utils/types';

import { DepositedFileRow } from 'apps/deposit/components/Dashboard/common/DepositedFileRow';
import { useDepositedFiles } from 'apps/deposit/data/queries';
import { FileDepository } from 'apps/deposit/types/models';

const PAGE_SIZE = 10;

const messages = {
  currentPaginatedItems: {
    defaultMessage: 'Showing {firstIndex} - {lastIndex} of {total}',
    description: 'Message to inform the user of the current displayed files.',
    id: 'components.DashboardInstructor.currentPaginatedItems',
  },
  noTitle: {
    defaultMessage: 'Click here to add a title',
    description: 'Instruction message to set a title for a file deposit',
    id: 'components.DashboardInstructor.noTitle',
  },
  noDescription: {
    defaultMessage: 'Click here to add a description',
    description: 'Instruction message to set a description for a file deposit',
    id: 'components.DashboardInstructor.noDescription',
  },
  fetchFilesError: {
    defaultMessage: 'Error fetching files',
    description: 'Error message when fetching files.',
    id: 'apps.deposit.components.DashboardInstructor.fetchFilesError',
  },
  readFilterOptionsAll: {
    defaultMessage: 'All',
    description: 'Filter option for all files.',
    id: 'apps.deposit.components.DashboardInstructor.readFilterOptionsAll',
  },
  readFilterOptionsUnread: {
    defaultMessage: 'Unread',
    description: 'Filter option for unread files.',
    id: 'apps.deposit.components.DashboardInstructor.readFilterOptionsUnread',
  },
  readFilterOptionsRead: {
    defaultMessage: 'Read',
    description: 'Filter option for read files.',
    id: 'apps.deposit.components.DashboardInstructor.readFilterOptionsRead',
  },
  readFilterTitle: {
    defaultMessage: 'Filter files',
    description: 'Title for filter files select.',
    id: 'apps.deposit.components.DashboardInstructor.readFilterTitle',
  },
  readFilterPlaceholder: {
    defaultMessage: 'Filter',
    description: 'Placeholder for filter files select.',
    id: 'apps.deposit.components.DashboardInstructor.readFilterPlaceholder',
  },
  filesListHeader: {
    defaultMessage: 'Students files',
    description: 'Header for student files list.',
    id: 'apps.deposit.components.DashboardInstructor.filesListHeader',
  },
};

interface DashboardInstructorProps {
  fileDepository: FileDepository;
}

export const DashboardInstructor = ({
  fileDepository,
}: DashboardInstructorProps) => {
  const intl = useIntl();
  const [depositedFilesOffset, setDepositedFilesOffset] = useState(0);
  const [indices, setIndices] = useState([0, PAGE_SIZE]);
  const [readFilter, setReadFilter] = useState<Maybe<string>>(undefined);

  const { data, isError, isLoading, refetch } = useDepositedFiles(
    fileDepository.id,
    { limit: PAGE_SIZE, offset: depositedFilesOffset, read: readFilter },
    {
      keepPreviousData: true,
    },
  );
  const readFilterOptions = [
    {
      label: intl.formatMessage(messages.readFilterOptionsAll),
      value: undefined,
    },
    {
      label: intl.formatMessage(messages.readFilterOptionsUnread),
      value: 'false',
    },
    {
      label: intl.formatMessage(messages.readFilterOptionsRead),
      value: 'true',
    },
  ];

  const onReadFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setReadFilter(event.target.value);
    refetch();
  };

  const onPageChange = async (event: any) => {
    setDepositedFilesOffset(event.startIndex);
    setIndices([event.startIndex, Math.min(event.endIndex, data!.count)]);
  };

  return (
    <React.Fragment>
      <Box
        background="white"
        elevation="medium"
        fill
        pad="xlarge"
        round="xsmall"
      >
        <Heading>{fileDepository.title}</Heading>
        <Paragraph>{fileDepository.description}</Paragraph>
      </Box>

      <Box
        background="white"
        elevation="medium"
        fill
        margin={{ top: 'small' }}
        pad="xlarge"
        round="xsmall"
      >
        <Heading>
          <FormattedMessage {...messages.filesListHeader} />
        </Heading>
        {isLoading ? (
          <Loader />
        ) : isError ? (
          <FormattedMessage {...messages.fetchFilesError} />
        ) : (
          data && (
            <React.Fragment>
              <Box
                align="center"
                direction="row"
                justify="between"
                pad="medium"
              >
                <Select
                  a11yTitle={intl.formatMessage(messages.readFilterTitle)}
                  id="readFilterSelect"
                  name="read"
                  placeholder={intl.formatMessage(
                    messages.readFilterPlaceholder,
                  )}
                  value={readFilter}
                  options={readFilterOptions}
                  labelKey="label"
                  valueKey={{ key: 'value', reduce: true }}
                  onChange={onReadFilterChange}
                />
                <Text>
                  <FormattedMessage
                    {...messages.currentPaginatedItems}
                    values={{
                      firstIndex: indices[0] + 1,
                      lastIndex: Math.min(indices[1], data.count),
                      total: data.count,
                    }}
                  />
                </Text>
                <Pagination
                  step={PAGE_SIZE}
                  numberItems={data.count}
                  onChange={onPageChange}
                />
              </Box>
              <Box fill margin={{ top: 'small' }} pad="medium" round="xsmall">
                {data.results.map((file) => (
                  <DepositedFileRow key={file.id} file={file} />
                ))}
              </Box>
            </React.Fragment>
          )
        )}
      </Box>
    </React.Fragment>
  );
};
