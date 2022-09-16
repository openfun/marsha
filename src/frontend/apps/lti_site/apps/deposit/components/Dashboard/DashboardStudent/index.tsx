import { Box, Grid, Heading, Paragraph, ResponsiveContext } from 'grommet';
import React, { useContext } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { Loader } from 'components/Loader';

import { DepositedFileRow } from 'apps/deposit/components/Dashboard/common/DepositedFileRow';
import { useDepositedFiles } from 'apps/deposit/data/queries';
import { FileDepository } from 'apps/deposit/types/models';

import { UploadFiles } from './UploadFiles';

const messages = defineMessages({
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
});

interface DashboardStudentProps {
  fileDepository: FileDepository;
}

export const DashboardStudent = ({ fileDepository }: DashboardStudentProps) => {
  const size = useContext(ResponsiveContext);
  const { data, isError, isLoading } = useDepositedFiles(fileDepository.id, {});

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
        {size === 'small' || size === 'xsmall' ? (
          <React.Fragment>
            <Paragraph>{fileDepository.description}</Paragraph>
            <UploadFiles />
          </React.Fragment>
        ) : (
          <Grid columns={{ count: 2, size: 'auto' }} gap="xlarge">
            <Paragraph>{fileDepository.description}</Paragraph>
            <UploadFiles />
          </Grid>
        )}
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
