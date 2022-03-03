import { Box, Spinner } from 'grommet';
import React, {
  Fragment,
  PropsWithChildren,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { getDecodedJwt } from 'data/appData';
import { useLiveSession } from 'data/stores/useLiveSession';
import { liveState, Video } from 'types/tracks';
import { converseMounter } from 'utils/conversejs/converse';
import { converse } from 'utils/window';

interface ConverseMonterProps {
  video: Video;
}

export const ConverseInitializer = ({
  children,
  video,
}: PropsWithChildren<ConverseMonterProps>) => {
  const initConverse = useMemo(() => {
    return converseMounter();
  }, [converseMounter]);
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

    const isAdmin = getDecodedJwt().permissions.can_access_dashboard;
    if (!isAdmin && liveSession) {
      initConverse(video.xmpp, liveSession.display_name);
    } else if (isAdmin) {
      initConverse(video.xmpp);
    }
  }, [initConverse, isConverseLoaded, liveSession, video]);

  if (!isConverseLoaded) {
    return (
      <Box fill>
        <Spinner margin="auto" data-testid="loader-id" />
      </Box>
    );
  }

  return <Fragment>{children}</Fragment>;
};
