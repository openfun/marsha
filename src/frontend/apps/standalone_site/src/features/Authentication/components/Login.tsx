import { Box, useResponsive } from 'lib-components';
import React from 'react';

import { LoginForm } from './LoginForm';
import { RenaterAuthenticator } from './RenaterAuthenticator';

export const Login = () => {
  const { breakpoint, isSmallerBreakpoint } = useResponsive();
  const isSmallerMedium = isSmallerBreakpoint(breakpoint, 'medium');
  const isSmallerSmall = isSmallerBreakpoint(breakpoint, 'small');

  return (
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
        <LoginForm />
      </Box>
      <Box
        width={{
          max: 'large',
          width: isSmallerSmall || breakpoint === 'xsmedium' ? '90%' : '80%',
        }}
        margin={{ top: 'large' }}
      >
        <RenaterAuthenticator />
      </Box>
    </React.Fragment>
  );
};
