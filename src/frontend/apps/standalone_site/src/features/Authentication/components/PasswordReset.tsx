import { Box } from 'grommet';
import React from 'react';

import { useResponsive } from 'hooks/useResponsive';

import { BaseAuthenticationPage } from './BaseAuthenticationPage';
import { PasswordResetForm } from './PasswordResetForm';

export const PasswordReset = () => {
  const { breakpoint, isSmallerBreakpoint } = useResponsive();
  const isSmallerMedium = isSmallerBreakpoint(breakpoint, 'medium');
  const isSmallerSmall = isSmallerBreakpoint(breakpoint, 'small');

  return (
    <BaseAuthenticationPage>
      <React.Fragment>
        <Box
          width={{
            max: 'large',
            width: isSmallerSmall || breakpoint === 'xsmedium' ? '90%' : '80%',
          }}
          pad={{
            horizontal:
              breakpoint === 'xsmedium'
                ? 'medium'
                : isSmallerMedium
                ? 'large'
                : 'xlarge',
          }}
        >
          <PasswordResetForm />
        </Box>
      </React.Fragment>
    </BaseAuthenticationPage>
  );
};
