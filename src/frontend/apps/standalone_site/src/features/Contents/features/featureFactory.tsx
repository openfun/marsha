import { useContentFeatures } from '../store/contentsStore';

import { ClassRoomRouter, ClassRoomContents } from './ClassRoom';
import { LiveRouter, LiveContents } from './Live';
import { VideoRouter, VideoContents } from './Video';

useContentFeatures.setState({
  featureRoutes: [
    <VideoRouter key="videoRouter" />,
    <ClassRoomRouter key="classRoomRouter" />,
    <LiveRouter key="liveRouter" />,
  ],
  featureSamples: [
    <ClassRoomContents key="classRoomContents" />,
    <LiveContents key="liveContents" />,
    <VideoContents key="videoContents" />,
  ],
});
