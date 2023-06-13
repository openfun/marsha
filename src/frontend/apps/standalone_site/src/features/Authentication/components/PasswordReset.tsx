import { Box } from 'grommet';
import { useResponsive } from 'lib-components';
import { PropsWithChildren, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';
import { useNavigate, useParams } from 'react-router-dom';

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

export const PasswordResetConfirm = () => {
  const intl = useIntl();
  const { uid, token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token || !uid) {
      toast.error(intl.formatMessage(messages.wrongUrlError));
      navigate({
        pathname: '/',
      });
    }
  }, [intl, navigate, token, uid]);

  if (uid && token) {
    return (
      <PasswordResetContainer>
        <PasswordResetConfirmForm uid={uid} token={token} />
      </PasswordResetContainer>
    );
  }

  return null;
};
