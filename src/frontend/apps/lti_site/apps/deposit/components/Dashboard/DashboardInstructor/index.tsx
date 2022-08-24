import { Box, Heading, Pagination, Select, Text } from 'grommet';
import React, { useState } from 'react';

import { Loader } from 'components/Loader';

import { Maybe } from 'utils/types';

import { DepositedFileRow } from 'apps/deposit/components/Dashboard/common/DepositedFileRow';
import { useDepositedFiles } from 'apps/deposit/data/queries';
import { FileDepository } from 'apps/deposit/types/models';

const PAGE_SIZE = 10;

interface DashboardInstructorProps {
  fileDepository: FileDepository;
}

export const DashboardInstructor = ({
  fileDepository,
}: DashboardInstructorProps) => {
  const [depositedFilesOffset, setDepositedFilesOffset] = useState(0);
  const [indices, setIndices] = useState([0, PAGE_SIZE]);
  const [readFilter, setReadFilter] = useState<Maybe<string>>(undefined);

  const { data, isError, isLoading, isSuccess, refetch } = useDepositedFiles(
    fileDepository.id,
    { limit: PAGE_SIZE, offset: depositedFilesOffset, read: readFilter },
    {
      keepPreviousData: true,
    },
  );
  const readFilterOptions = [
    {
      label: 'All',
      value: undefined,
    },
    {
      label: 'Unread',
      value: 'false',
    },
    {
      label: 'Read',
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
        pad="medium"
        round="xsmall"
      >
        <Box align="center" direction="row" justify="between">
          {isSuccess && (
            <React.Fragment>
              <Select
                a11yTitle="Filter files"
                id="readFilterSelect"
                name="read"
                placeholder={'Filter'}
                value={readFilter}
                options={readFilterOptions}
                labelKey="label"
                valueKey={{ key: 'value', reduce: true }}
                onChange={onReadFilterChange}
              />
              <Text>
                Showing {indices[0] + 1} - {Math.min(indices[1], data!.count)}{' '}
                of {data!.count}
              </Text>
              <Pagination
                step={PAGE_SIZE}
                numberItems={data?.count}
                onChange={onPageChange}
              />
            </React.Fragment>
          )}
        </Box>
      </Box>
      <Box
        background="white"
        elevation="medium"
        fill
        margin={{ top: 'small' }}
        pad="medium"
        round="xsmall"
      >
        <Heading>Students files</Heading>
        {isLoading ? (
          <Loader />
        ) : isError ? (
          <p>Error</p>
        ) : (
          <Box fill margin={{ top: 'small' }} pad="medium" round="xsmall">
            {data?.results.map((file) => (
              <DepositedFileRow key={file.id} file={file} />
            ))}
          </Box>
        )}
      </Box>
    </React.Fragment>
  );
};
