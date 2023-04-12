import { useContentFeatures } from '../store/contentsStore';

import {
  ClassRoomRouter,
  ClassRoomContents,
  ClassRoomShuffle,
} from './ClassRoom';
import { LiveRouter, LiveContents } from './Live';
import { VideoRouter, VideoContents } from './Video';

useContentFeatures.setState({
  featureRoutes: [
    <VideoRouter key="videoRouter" />,
    <ClassRoomRouter key="classRoomRouter" />,
    <LiveRouter key="liveRouter" />,
  ],
  featureSamples: (playlistId) => [
    <ClassRoomContents key="classRoomContents" playlistId={playlistId} />,
    <LiveContents key="liveContents" playlistId={playlistId} />,
    <VideoContents key="videoContents" playlistId={playlistId} />,
  ],
  featureShuffles: [<ClassRoomShuffle key="classRoomShuffle" />],
});
