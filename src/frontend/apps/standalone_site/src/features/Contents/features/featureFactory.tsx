import { useContentFeatures } from '../store/contentsStore';

import { ClassRoomRouter } from './ClassRoom';
import { LiveRouter } from './Live';
import { VideoRouter } from './Video';

useContentFeatures.setState({
  featureRoutes: [
    <VideoRouter key="videoRouter" />,
    <ClassRoomRouter key="classRoomRouter" />,
    <LiveRouter key="liveRouter" />,
  ],
});
