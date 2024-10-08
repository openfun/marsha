import { Maybe } from 'lib-common';
import {
  DecodedJwtLTI,
  decodeJwt,
  flags,
  useAppConfig,
  useDocument,
  useFlags,
  useJwt,
  useMaintenance,
  useP2PConfig,
  useSentry,
} from 'lib-components';
import { useAttendance, useSetVideoState } from 'lib-video';
import React, {
  Fragment,
  PropsWithChildren,
  useEffect,
  useMemo,
  useState,
} from 'react';

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
  const [setFlags, isFlagEnabled] = useFlags((state) => [
    state.setFlags,
    state.isFlagEnabled,
  ]);
  const jwt = useJwt((state) => state.getJwt());
  const setSentry = useSentry((state) => state.setSentry);
  const setP2PConfig = useP2PConfig((state) => state.setP2PConfig);

  useSetVideoState(appConfig.video);
  const addDocument = useDocument((state) => state.addResource);
  const setAttendanceDelay = useAttendance((state) => state.setDelay);

  const decodedJwt = useMemo(() => {
    if (jwt && isJwtInitialized) {
      return decodeJwt(jwt) as DecodedJwtLTI;
    }
    return null;
  }, [jwt, isJwtInitialized]);

  useEffect(() => {
    if (!appConfig.flags) {
      return;
    }

    setFlags(appConfig.flags);
  }, [setFlags, appConfig.flags]);

  useEffect(() => {
    if (isJwtInitialized) {
      return;
    }

    useJwt.setState({ jwt: props.jwt, refreshJwt: props.refresh_token });
    setIsJwtInitialized(true);
  }, [isJwtInitialized, props.jwt, props.refresh_token]);

  useEffect(() => {
    if (isFlagEnabled(flags.SENTRY) && appConfig.sentry_dsn) {
      setSentry(
        appConfig.sentry_dsn,
        appConfig.environment,
        appConfig.release,
        'frontend',
      );
    }
  }, [
    appConfig.sentry_dsn,
    appConfig.environment,
    appConfig.release,
    setSentry,
    isFlagEnabled,
  ]);

  useEffect(() => {
    setP2PConfig(
      appConfig.p2p.isEnabled,
      appConfig.p2p.stunServerUrls,
      appConfig.p2p.webTorrentTrackerUrls,
    );
  }, [
    appConfig.p2p.isEnabled,
    appConfig.p2p.stunServerUrls,
    appConfig.p2p.webTorrentTrackerUrls,
    setP2PConfig,
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
