import * as Sentry from '@sentry/browser';
import {
  decodeJwt,
  useJwt,
  useMaintenance,
  useSentry,
  useVideo,
  useTimedTextTrack,
  useThumbnail,
  useSharedLiveMedia,
  useDocument,
  useAppConfig,
  flags,
} from 'lib-components';
import { useAttendance } from 'lib-video';
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
  const jwt = useJwt((state) => state.jwt);
  const setIsSentryReady = useSentry((state) => state.setIsSentryReady);
  const addVideo = useVideo((state) => state.addResource);
  const addMultipleTimedTextTrack = useTimedTextTrack(
    (state) => state.addMultipleResources,
  );
  const addThumbnail = useThumbnail((state) => state.addResource);
  const addMultipleSharedLiveMedia = useSharedLiveMedia(
    (state) => state.addMultipleResources,
  );
  const addDocument = useDocument((state) => state.addResource);
  const setAttendanceDelay = useAttendance((state) => state.setDelay);

  const isFeatureEnabled = useIsFeatureEnabled();

  const decodedJwt = useMemo(() => {
    if (jwt && isJwtInitialized) {
      return decodeJwt(jwt);
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
    if (appConfig.video) {
      addVideo(appConfig.video);
    }
  }, [appConfig.video, addVideo]);

  useEffect(() => {
    if (
      appConfig.video?.timed_text_tracks &&
      appConfig.video.timed_text_tracks.length > 0
    ) {
      addMultipleTimedTextTrack(appConfig.video.timed_text_tracks);
    }
  }, [appConfig.video?.timed_text_tracks, addMultipleTimedTextTrack]);

  useEffect(() => {
    if (appConfig.video?.thumbnail) {
      addThumbnail(appConfig.video.thumbnail);
    }
  }, [appConfig.video?.thumbnail, addThumbnail]);

  useEffect(() => {
    if (
      appConfig.video?.shared_live_medias &&
      appConfig.video.shared_live_medias.length > 0
    ) {
      addMultipleSharedLiveMedia(appConfig.video.shared_live_medias);
    }
  }, [appConfig.video?.shared_live_medias, addMultipleSharedLiveMedia]);

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
