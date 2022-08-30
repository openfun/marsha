import { Box, Grid, Heading, Paragraph } from 'grommet';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import { Loader } from 'components/Loader';

import { DepositedFileRow } from 'apps/deposit/components/Dashboard/common/DepositedFileRow';
import { useDepositedFiles } from 'apps/deposit/data/queries';
import { FileDepository } from 'apps/deposit/types/models';

import { UploadFiles } from './UploadFiles';

const messages = {
  fetchFilesError: {
    defaultMessage: 'Error fetching files',
    description: 'Error message when fetching files.',
    id: 'apps.deposit.components.DashboardStudent.fetchFilesError',
  },
  filesListHeader: {
    defaultMessage: 'My files',
    description: 'Header for student files list.',
    id: 'apps.deposit.components.DashboardStudent.filesListHeader',
  },
};

interface DashboardStudentProps {
  fileDepository: FileDepository;
}

export const DashboardStudent = ({ fileDepository }: DashboardStudentProps) => {
  const { data, isError, isLoading } = useDepositedFiles(fileDepository.id, {});

  return (
    <React.Fragment>
      <Box
        background="white"
        elevation="medium"
        fill
        pad="medium"
        round="xsmall"
      >
        <Heading>{fileDepository.title}</Heading>
        <Grid columns={{ count: 2, size: 'auto' }} gap="small">
          <Paragraph color="blue-active">
            {fileDepository.description}
          </Paragraph>
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
        <Heading>
          <FormattedMessage {...messages.filesListHeader} />
        </Heading>
        {isLoading ? (
          <Loader />
        ) : isError ? (
          <FormattedMessage {...messages.fetchFilesError} />
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
