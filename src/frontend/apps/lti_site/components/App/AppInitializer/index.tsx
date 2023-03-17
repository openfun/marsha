import * as Sentry from '@sentry/browser';
import {
  decodeJwt,
  useJwt,
  useMaintenance,
  useSentry,
  useDocument,
  useAppConfig,
  flags,
  DecodedJwtLTI,
} from 'lib-components';
import { useAttendance, useSetVideoState } from 'lib-video';
import React, {
  Fragment,
  PropsWithChildren,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useIsFeatureEnabled } from 'data/hooks/useIsFeatureEnabled';
import { Maybe } from 'lib-common';

interface AppInitializerProps {
  jwt: Maybe<string>;
  refresh_token: Maybe<string>;
}

export const AppInitializer = (
  props: PropsWithChildren<AppInitializerProps>,
) => {
  const [isAppInitialized, setIsAppInitialized] = useState(false);
  const [isJwtInitialized, setIsJwtInitialized] = useState(false);

  const appConfig = useAppConfig();
  const jwt = useJwt((state) => state.getJwt());
  const setIsSentryReady = useSentry((state) => state.setIsSentryReady);
  useSetVideoState(appConfig.video);
  const addDocument = useDocument((state) => state.addResource);
  const setAttendanceDelay = useAttendance((state) => state.setDelay);

  const isFeatureEnabled = useIsFeatureEnabled();

  const decodedJwt = useMemo(() => {
    if (jwt && isJwtInitialized) {
      return decodeJwt(jwt) as DecodedJwtLTI;
    }
    return null;
  }, [jwt, isJwtInitialized]);

  useEffect(() => {
    if (isJwtInitialized) {
      return;
    }

    useJwt.setState({ jwt: props.jwt, refreshJwt: props.refresh_token });
    setIsJwtInitialized(true);
  }, [isJwtInitialized, props.jwt, props.refresh_token]);

  useEffect(() => {
    if (isFeatureEnabled(flags.SENTRY) && appConfig.sentry_dsn) {
      Sentry.init({
        dsn: appConfig.sentry_dsn,
        environment: appConfig.environment,
        release: appConfig.release,
      });
      Sentry.configureScope((scope) =>
        scope.setExtra('application', 'frontend'),
      );

      setIsSentryReady(true);
    }
  }, [
    appConfig.sentry_dsn,
    appConfig.environment,
    appConfig.release,
    setIsSentryReady,
    isFeatureEnabled,
  ]);

  useEffect(() => {
    if (appConfig.document) {
      addDocument(appConfig.document);
    }
  }, [appConfig.document, addDocument]);

  useEffect(() => {
    setAttendanceDelay(appConfig.attendanceDelay);
  }, [appConfig.attendanceDelay, setAttendanceDelay]);

  useEffect(() => {
    if (!decodedJwt?.maintenance) {
      return;
    }

    useMaintenance.setState({
      isActive: decodedJwt?.maintenance,
    });
  }, [decodedJwt?.maintenance]);

  //  call this effect last to configure all stores first
  useEffect(() => {
    if (!isJwtInitialized) {
      return;
    }

    setIsAppInitialized(true);
  }, [isJwtInitialized, setIsAppInitialized]);

  if (!isAppInitialized) {
    return null;
  }

  return <Fragment>{props.children}</Fragment>;
};
