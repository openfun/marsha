import { Box, Spinner, Text, ThemeContext, ThemeType } from 'grommet';
import React, { Suspense } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { useJwt } from 'data/stores/useJwt';
import { UploadManager } from 'components/UploadManager';

import { depositAppData } from 'apps/deposit/data/depositAppData';
import { useFileDepository } from 'apps/deposit/data/queries';

import { DashboardStudent } from './DashboardStudent';
import { DashboardInstructor } from './DashboardInstructor';

const messages = defineMessages({
  loadingFileDepository: {
    defaultMessage: 'Loading fileDepository...',
    description:
      'Accessible message for the spinner while loading the fileDepository in dashboard view.',
    id: 'component.DashboardFileDepository.loadingFileDepository',
  },
  loadFileDepositorySuccess: {
    defaultMessage: 'FileDepository loaded.',
    description: 'Message when fileDepository is loaded.',
    id: 'component.DashboardFileDepository.loadFileDepositorySuccess',
  },
  loadFileDepositoryError: {
    defaultMessage: 'FileDepository not loaded!',
    description: 'Message when fileDepository failed to load.',
    id: 'component.DashboardFileDepository.loadFileDepositoryError',
  },
});

const extendedTheme: ThemeType = {
  heading: {
    font: {
      family: 'Roboto-Bold',
    },
    color: 'blue-active',
    level: {
      1: {
        medium: {
          size: '2.5rem',
        },
      },
    },
  },
  button: {
    primary: {},
  },
};

const Dashboard = () => {
  const getDecodedJwt = useJwt((state) => state.getDecodedJwt);
  let canUpdate: boolean;
  try {
    canUpdate = getDecodedJwt().permissions.can_update;
  } catch (e) {
    return <Text>Token Error</Text>;
  }

  const { data: fileDepository, status: useFileDepositoryStatus } =
    useFileDepository(depositAppData.fileDepository!.id, {
      refetchInterval: 0,
      refetchOnWindowFocus: false,
    });

  let content: JSX.Element;
  switch (useFileDepositoryStatus) {
    case 'idle':
    case 'loading':
      content = (
        <Spinner size="large">
          <FormattedMessage {...messages.loadingFileDepository} />
        </Spinner>
      );
      break;

    case 'error':
      content = <FormattedMessage {...messages.loadFileDepositoryError} />;
      break;

    case 'success':
      if (!canUpdate) {
        // Student dashboard
        content = <DashboardStudent fileDepository={fileDepository} />;
      } else {
        // Instructor dashboard
        content = <DashboardInstructor fileDepository={fileDepository} />;
      }
      break;
  }

  return (
    <UploadManager>
      <ThemeContext.Extend value={extendedTheme}>
        <Box
          align="center"
          background={'linear-gradient(-180deg, #dce9fa 0%, #EDF5FA 100%);'}
          pad="small"
        >
          {content}
        </Box>
      </ThemeContext.Extend>
    </UploadManager>
  );
};

export default Dashboard;
