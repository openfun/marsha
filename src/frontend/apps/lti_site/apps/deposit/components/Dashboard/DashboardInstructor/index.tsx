import { Box, Heading, Pagination, Text } from 'grommet';
import React, { useState } from 'react';

import { Loader } from 'components/Loader';

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

  const { data, isError, isLoading } = useDepositedFiles(
    fileDepository.id,
    { limit: PAGE_SIZE, offset: depositedFilesOffset },
    {
      keepPreviousData: true,
    },
  );

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
          <Text>
            Showing {indices[0] + 1} - {indices[1]} of {data?.count}
          </Text>
          <Pagination
            step={PAGE_SIZE}
            numberItems={data?.count}
            onChange={onPageChange}
          />
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
