import { Grid } from 'grommet';
import { Breakpoints } from 'lib-common';
import {
  Box,
  BoxLoader,
  FileDepository,
  Heading,
  Text,
  useResponsive,
} from 'lib-components';
import React from 'react';
import { FormattedMessage, defineMessages } from 'react-intl';

import { DepositedFileRow } from 'apps/deposit/components/Dashboard/common/DepositedFileRow';
import { useDepositedFiles } from 'apps/deposit/data/queries';

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
  const { isSmallerBreakpoint, breakpoint, isMobile } = useResponsive();
  const { data, isError, isLoading } = useDepositedFiles(fileDepository.id);

  const isXsmall = isSmallerBreakpoint(breakpoint, Breakpoints.xsmall);
  const isSmall = isSmallerBreakpoint(breakpoint, Breakpoints.small);

  return (
    <React.Fragment>
      <Box
        background="white"
        elevation
        fill
        pad={isXsmall ? 'xsmall' : isSmall ? 'small' : 'xlarge'}
        round="xsmall"
      >
        <Heading>{fileDepository.title}</Heading>
        {isMobile ? (
          <React.Fragment>
            <Text type="p">{fileDepository.description}</Text>
            <UploadFiles />
          </React.Fragment>
        ) : (
          <Grid columns={{ count: 2, size: 'auto' }} gap="xlarge">
            <Text type="p">{fileDepository.description}</Text>
            <UploadFiles />
          </Grid>
        )}
      </Box>
      <Box
        background="white"
        elevation
        fill
        margin={{ top: 'small' }}
        pad={isXsmall ? 'xsmall' : isSmall ? 'small' : 'xlarge'}
        round="xsmall"
      >
        <Heading>
          <FormattedMessage {...messages.filesListHeader} />
        </Heading>
        {isLoading ? (
          <BoxLoader />
        ) : isError ? (
          <FormattedMessage {...messages.fetchFilesError} />
        ) : (
          <Box fill margin={{ top: 'small' }}>
            {data?.results.map((file) => (
              <DepositedFileRow key={file.id} file={file} />
            ))}
          </Box>
        )}
      </Box>
    </React.Fragment>
  );
};
