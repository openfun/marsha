import { Box, Spinner, ThemeContext, ThemeType } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { theme } from 'lib-common';
import { useCurrentResourceContext, UploadManager } from 'lib-components';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { depositAppData } from 'apps/deposit/data/depositAppData';
import { useFileDepository } from 'apps/deposit/data/queries';

import { DashboardStudent } from './DashboardStudent';
import { DashboardInstructor } from './DashboardInstructor';

const messages = defineMessages({
  loadingFileDepository: {
    defaultMessage: 'Loading file depository...',
    description:
      'Accessible message for the spinner while loading the file depository in dashboard view.',
    id: 'apps.deposit.components.Dashboard.loadingFileDepository',
  },
  loadFileDepositorySuccess: {
    defaultMessage: 'File depository loaded.',
    description: 'Message when file depository is loaded.',
    id: 'apps.deposit.components.Dashboard.loadFileDepositorySuccess',
  },
  loadFileDepositoryError: {
    defaultMessage: 'File depository not loaded!',
    description: 'Message when file depository failed to load.',
    id: 'apps.deposit.components.Dashboard.loadFileDepositoryError',
  },
  tokenError: {
    defaultMessage: 'Token Error',
    description: 'Message when token is not valid.',
    id: 'apps.deposit.components.Dashboard.tokenError',
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
  text: {
    extend: `color: ${normalizeColor('blue-active', theme)};`,
  },
  paragraph: {
    extend: `color: ${normalizeColor('blue-active', theme)};`,
  },
  pagination: {
    button: {
      extend: `color: ${normalizeColor('blue-active', theme)};`,
    },
  },
};

const Dashboard = () => {
  const [context] = useCurrentResourceContext();
  const canUpdate = context.permissions.can_update;

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
