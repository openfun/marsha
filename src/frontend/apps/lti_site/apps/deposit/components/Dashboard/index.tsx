import { Box, Grommet, Spinner, ThemeType } from 'grommet';
import { deepMerge, normalizeColor } from 'grommet/utils';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { UploadManager } from 'components/UploadManager';
import { useJwt } from 'data/stores/useJwt';
import { theme } from 'utils/theme/theme';

import { depositAppData } from 'apps/deposit/data/depositAppData';
import { useFileDepository } from 'apps/deposit/data/queries';

import { DashboardStudent } from './DashboardStudent';
import { DashboardInstructor } from './DashboardInstructor';

const messages = defineMessages({
  loadingFileDepository: {
    defaultMessage: 'Loading fileDepository...',
    description:
      'Accessible message for the spinner while loading the fileDepository in dashboard view.',
    id: 'apps.deposit.components.Dashboard.loadingFileDepository',
  },
  loadFileDepositorySuccess: {
    defaultMessage: 'FileDepository loaded.',
    description: 'Message when fileDepository is loaded.',
    id: 'apps.deposit.components.Dashboard.loadFileDepositorySuccess',
  },
  loadFileDepositoryError: {
    defaultMessage: 'FileDepository not loaded!',
    description: 'Message when fileDepository failed to load.',
    id: 'apps.deposit.components.Dashboard.loadFileDepositoryError',
  },
  tokenError: {
    defaultMessage: 'Token Error',
    description: 'Message when token is not valid.',
    id: 'apps.deposit.components.Dashboard.tokenError',
  },
});

const extendedTheme: ThemeType = {
  global: {
    breakpoints: {
      xsmall: { value: 840 },
      small: { value: 1024 },
      medium: { value: 1440 },
      large: { value: 1800 },
      xlarge: {},
    },
  },
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
  const getDecodedJwt = useJwt((state) => state.getDecodedJwt);
  let canUpdate: boolean;
  try {
    canUpdate = getDecodedJwt().permissions.can_update;
  } catch (e) {
    return <FormattedMessage {...messages.tokenError} />;
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
      <Grommet theme={deepMerge(theme, extendedTheme)}>
        <Box
          align="center"
          background={'linear-gradient(-180deg, #dce9fa 0%, #EDF5FA 100%);'}
          pad="small"
        >
          {content}
        </Box>
      </Grommet>
    </UploadManager>
  );
};

export default Dashboard;
