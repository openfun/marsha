import { Loader, useJwt } from 'lib-components';
import { Fragment, PropsWithChildren, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export const VisitorAuthenticator = ({
  children,
}: PropsWithChildren<unknown>) => {
  const { inviteId } = useParams<{ inviteId?: string }>();
  const { jwt, setJwt } = useJwt((state) => ({
    jwt: state.getJwt(),
    setJwt: state.setJwt,
  }));

  useEffect(() => {
    if (!inviteId) {
      return;
    }

    setJwt(inviteId);
  }, [inviteId, setJwt]);

  if (!jwt) {
    return <Loader />;
  }

  return <Fragment>{children}</Fragment>;
};
