import { Box } from 'grommet';
import React from 'react';
import { useIntl, defineMessages } from 'react-intl';

import imageLeft from 'assets/img/telescope.png';
import { ReactComponent as LogoIcon } from 'assets/svg/logo_marsha.svg';

import { LoginForm } from './LoginForm';
import { RenaterAuthenticator } from './RenaterAuthenticator';

const messages = defineMessages({
  altLogo: {
    defaultMessage: 'Marsha logo',
    description: 'Accessible description for the Marsha logo',
    id: 'features.Authentication.Login.altLogo',
  },
});

export const Login = () => {
  const intl = useIntl();

  return (
    <Box direction="row" height="100vh" background="bg-lightgrey2">
      <Box
        align="center"
        justify="center"
        background={`
            linear-gradient(to right, rgba(5, 95, 210, 0.75), rgba(5, 95, 210, 0.75)), 
            url(${imageLeft}) no-repeat center center / contain, 
            linear-gradient(45deg,rgba(255, 11, 57, 0.3) 0%,rgba(3, 92, 205, 0.9) 100%)`}
        style={{ flex: '1' }}
      >
        <LogoIcon
          color="white"
          width="80%"
          height="30%"
          aria-label={intl.formatMessage(messages.altLogo)}
        />
      </Box>
      <Box style={{ flex: '1' }} align="center" justify="center">
        <Box width="60%">
          <LoginForm />
        </Box>
        <Box width="90%" margin={{ top: 'large' }}>
          <RenaterAuthenticator />
        </Box>
      </Box>
    </Box>
  );
};
