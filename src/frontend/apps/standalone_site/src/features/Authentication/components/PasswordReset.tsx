import { Box } from 'grommet';
import { useResponsive } from 'lib-components';
import React, { PropsWithChildren, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useIntl, defineMessages } from 'react-intl';
import { useHistory, useLocation, useParams } from 'react-router-dom';

import { PasswordResetConfirmForm } from './PasswordResetConfirmForm';
import { PasswordResetForm } from './PasswordResetForm';

const messages = defineMessages({
  wrongUrlError: {
    defaultMessage:
      'Ooops! Something went wrong with the URL. Please check it and try again.',
    description: 'Error toasts when the URL is wrong.',
    id: 'features.Authentication.components.PasswordResetConfirm.wrongUrlError',
  },
});

const PasswordResetContainer = ({ children }: PropsWithChildren<unknown>) => {
  const { breakpoint, isSmallerBreakpoint } = useResponsive();
  const isSmallerMedium = isSmallerBreakpoint(breakpoint, 'medium');
  const isSmallerSmall = isSmallerBreakpoint(breakpoint, 'small');

  return (
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
      {children}
    </Box>
  );
};

export const PasswordReset = () => {
  return (
    <PasswordResetContainer>
      <PasswordResetForm />
    </PasswordResetContainer>
  );
};

interface PasswordResetConfirmRouteParams {
  uid: string;
  token: string;
}

export const PasswordResetConfirm = () => {
  const intl = useIntl();
  const { uid, token } = useParams<PasswordResetConfirmRouteParams>();
  const tokenRef = useRef(token); // store the token to use after URL cleaning
  const location = useLocation();
  const history = useHistory();

  useEffect(() => {
    if (!tokenRef.current) {
      toast.error(intl.formatMessage(messages.wrongUrlError));
      history.replace({
        pathname: '/',
      });
    }
    if (token) {
      // remove token from URL, just in case
      history.replace({
        pathname: location.pathname.replace(`/${token}`, ''),
      });
    }
  }, [history, intl, location.pathname, token]);

  return (
    <PasswordResetContainer>
      <PasswordResetConfirmForm uid={uid} token={tokenRef.current} />
    </PasswordResetContainer>
  );
};
