import { Box, Heading } from 'grommet';
import React from 'react';

import { DepositedFileRow } from 'apps/deposit/components/Dashboard/common/DepositedFileRow';
import { FileDepository } from 'apps/deposit/types/models';

interface DashboardInstructorProps {
  fileDepository: FileDepository;
}

export const DashboardInstructor = ({
  fileDepository,
}: DashboardInstructorProps) => (
  <React.Fragment>
    <Box
      background="white"
      elevation="medium"
      fill
      pad="medium"
      round="xsmall"
    ></Box>
    <Box
      background="white"
      elevation="medium"
      fill
      margin={{ top: 'small' }}
      pad="medium"
      round="xsmall"
    >
      <Heading>Students files</Heading>
      <Box fill margin={{ top: 'small' }} pad="medium" round="xsmall">
        {fileDepository.deposited_files.map((file) => (
          <DepositedFileRow key={file.id} file={file} />
        ))}
      </Box>
    </Box>
  </React.Fragment>
);
