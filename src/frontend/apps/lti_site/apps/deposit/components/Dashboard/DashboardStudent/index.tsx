import { Box, Grid, Heading, Paragraph } from 'grommet';
import React from 'react';

import { DepositedFileRow } from 'apps/deposit/components/Dashboard/common/DepositedFileRow';
import { FileDepository } from 'apps/deposit/types/models';

import { UploadFiles } from './UploadFiles';

interface DashboardStudentProps {
  fileDepository: FileDepository;
}

export const DashboardStudent = ({ fileDepository }: DashboardStudentProps) => (
  <React.Fragment>
    <Box background="white" elevation="medium" fill pad="medium" round="xsmall">
      <Heading>{fileDepository.title}</Heading>
      <Grid columns={{ count: 2, size: 'auto' }} gap="small">
        <Paragraph color="blue-active">{fileDepository.description}</Paragraph>
        <UploadFiles />
      </Grid>
    </Box>
    <Box
      background="white"
      elevation="medium"
      fill
      margin={{ top: 'small' }}
      pad="medium"
      round="xsmall"
    >
      <Heading>My files</Heading>
      {fileDepository.deposited_files.map((file) => (
        <DepositedFileRow key={file.id} file={file} />
      ))}
    </Box>
  </React.Fragment>
);
