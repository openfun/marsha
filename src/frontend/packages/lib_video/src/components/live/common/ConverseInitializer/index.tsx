import { Box, Spinner } from 'grommet';
import { liveState, useCurrentResourceContext } from 'lib-components';
import React, {
  Fragment,
  PropsWithChildren,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useCurrentVideo } from '@lib-video/hooks/useCurrentVideo';
import { useLiveSession } from '@lib-video/hooks/useLiveSession';
import { converseMounter } from '@lib-video/utils/conversejs/converse';
import { converse } from '@lib-video/utils/window';

export const ConverseInitializer = ({
  children,
}: PropsWithChildren<unknown>) => {
  const video = useCurrentVideo();
  const [context] = useCurrentResourceContext();
  const initConverse = useMemo(() => {
    return converseMounter();
  }, []);
  const [isConverseLoaded, setIsConverseLoaded] = useState(
    converse !== undefined,
  );
  const liveSession = useLiveSession((state) => state.liveSession);

  useEffect(() => {
    const eventHandler = () => {
      setIsConverseLoaded(true);
    };
    if (!isConverseLoaded) {
      window.addEventListener('converse-loaded', eventHandler);
    }
    return () => {
      window.removeEventListener('converse-loaded', eventHandler);
    };
  }, [isConverseLoaded]);

  useEffect(() => {
    if (!isConverseLoaded) {
      //  converse is not loaded yet in the window
      //  wait for initialization
      return;
    }

    if (
      !video.live_state ||
      video.live_state === liveState.IDLE ||
      !video.xmpp
    ) {
      //  video state is not ready to use XMPP and converse
      return;
    }

    const isAdmin = context.permissions.can_access_dashboard;
    if (!isAdmin && liveSession) {
      initConverse(video.xmpp, video, liveSession.display_name);
    } else if (isAdmin) {
      initConverse(video.xmpp, video);
    }
  }, [initConverse, isConverseLoaded, liveSession, video, context]);

  if (!isConverseLoaded) {
    return (
      <Box fill>
        <Spinner margin="auto" data-testid="loader-id" />
      </Box>
    );
  }

  return <Fragment>{children}</Fragment>;
};
