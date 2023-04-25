import { useContentFeatures } from '../store/contentsStore';

import {
  classRoomContents,
  ClassRoomRouter,
  ClassRoomShuffle,
} from './ClassRoom';
import { liveContents, LiveRouter } from './Live';
import { videoContents, VideoRouter } from './Video';

useContentFeatures.setState({
  featureRoutes: [
    <VideoRouter key="videoRouter" />,
    <ClassRoomRouter key="classRoomRouter" />,
    <LiveRouter key="liveRouter" />,
  ],
  featureSamples: (playlistId) => [
    videoContents(playlistId),
    liveContents(playlistId),
    classRoomContents(playlistId),
  ],
  featureShuffles: [<ClassRoomShuffle key="classRoomShuffle" />],
});
