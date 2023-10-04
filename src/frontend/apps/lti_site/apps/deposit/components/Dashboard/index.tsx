import { Loader } from '@openfun/cunningham-react';
import { Box, ThemeContext, ThemeType } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { theme } from 'lib-common';
import { UploadManager, useCurrentResourceContext } from 'lib-components';
import React, { Fragment } from 'react';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';

import { depositAppData } from 'apps/deposit/data/depositAppData';
import { useFileDepository } from 'apps/deposit/data/queries';

import { DashboardInstructor } from './DashboardInstructor';
import { DashboardStudent } from './DashboardStudent';

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
  const intl = useIntl();
  const [context] = useCurrentResourceContext();
  const canUpdate = context.permissions.can_update;

  const {
    data: fileDepository,
    status: useFileDepositoryStatus,
    fetchStatus: useFileDepositoryFetchStatus,
  } = useFileDepository(depositAppData.fileDepository?.id || '', {
    refetchInterval: 0,
    refetchOnWindowFocus: false,
  });

  let content: JSX.Element = <Fragment />;
  if (useFileDepositoryStatus === 'error') {
    content = <FormattedMessage {...messages.loadFileDepositoryError} />;
  } else if (useFileDepositoryStatus === 'success') {
    if (!canUpdate) {
      // Student dashboard
      content = <DashboardStudent fileDepository={fileDepository} />;
    } else {
      // Instructor dashboard
      content = <DashboardInstructor fileDepository={fileDepository} />;
    }
  } else if (
    useFileDepositoryFetchStatus === 'idle' ||
    useFileDepositoryStatus === 'loading'
  ) {
    content = (
      <Loader aria-label={intl.formatMessage(messages.loadingFileDepository)} />
    );
  }

  return (
    <UploadManager>
      <ThemeContext.Extend value={extendedTheme}>
        <Box
          align="center"
          background="linear-gradient(-180deg, #dce9fa 0%, #EDF5FA 100%);"
          pad="small"
        >
          {content}
        </Box>
      </ThemeContext.Extend>
    </UploadManager>
  );
};

export default Dashboard;
