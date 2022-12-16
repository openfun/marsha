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

export const AppInitializer = ({ children }: PropsWithChildren<{}>) => {
  const [isAppInitialized, setIsAppInitialized] = useState(false);

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

  const decodedJwt = useMemo(() => decodeJwt(jwt), [jwt]);

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
  }, [appConfig, setIsSentryReady, isFeatureEnabled]);

  useEffect(() => {
    if (appConfig.video) {
      addVideo(appConfig.video);
    }
  }, [appConfig, addVideo]);

  useEffect(() => {
    if (
      appConfig.video &&
      appConfig.video.timed_text_tracks &&
      appConfig.video.timed_text_tracks.length > 0
    ) {
      addMultipleTimedTextTrack(appConfig.video.timed_text_tracks);
    }
  }, [appConfig, addMultipleTimedTextTrack]);

  useEffect(() => {
    if (appConfig.video && appConfig.video.thumbnail) {
      addThumbnail(appConfig.video.thumbnail);
    }
  }, [appConfig, addThumbnail]);

  useEffect(() => {
    if (
      appConfig.video &&
      appConfig.video.shared_live_medias &&
      appConfig.video.shared_live_medias.length > 0
    ) {
      addMultipleSharedLiveMedia(appConfig.video.shared_live_medias);
    }
  }, [appConfig, addMultipleSharedLiveMedia]);

  useEffect(() => {
    if (appConfig.document) {
      addDocument(appConfig.document);
    }
  }, [appConfig, addDocument]);

  useEffect(() => {
    setAttendanceDelay(appConfig.attendanceDelay);
  }, [appConfig, setAttendanceDelay]);

  useEffect(() => {
    useMaintenance.setState({
      isActive: decodedJwt.maintenance,
    });
  }, [decodedJwt]);

  //  call this effect last to configure all stores first
  useEffect(() => {
    setIsAppInitialized(true);
  }, [setIsAppInitialized]);

  if (!isAppInitialized) {
    return null;
  }

  return <Fragment>{children}</Fragment>;
};
