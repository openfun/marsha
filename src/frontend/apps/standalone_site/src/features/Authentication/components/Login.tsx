import { Box } from 'grommet';
import React from 'react';

import { ReactComponent as LogoIcon } from 'assets/svg/logo_marsha.svg';
import { WhiteCard } from 'components/Cards';
import { useResponsive } from 'hooks/useResponsive';

import { LoginForm } from './LoginForm';
import { RenaterSamlFerIdpSearchSelect } from './RenaterSamlFerIdpSearchSelect';

export const Login = () => {
  const { isDesktop } = useResponsive();

  return (
    <Box
      direction="row"
      align="center"
      justify="center"
      style={{ backgroundColor: '#055fd2', height: '100vh', width: '100vw' }}
      fill
    >
      {isDesktop ? (
        <Box margin="medium" justify="center" align="center">
          <LogoIcon fill="white" width="100%" height="100%" />
        </Box>
      ) : null}
      <Box direction="column" justify="center" align="center">
        <Box direction="row" width="100%" style={{ maxWidth: '566px' }}>
          <WhiteCard flex="grow">
            <LoginForm />
            <RenaterSamlFerIdpSearchSelect />
          </WhiteCard>
        </Box>
      </Box>
    </Box>
  );
};
