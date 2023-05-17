/**
 * Init the contents feature state by loading the necessary children components:
 *  - featureRouter: Load the router of the children features (/my-contents/videos, /my-contents/classroom...) @see ContentsRouter
 *  - featureRoutes: Load the routes and the link menu of the children features @see routes
 *  - featureSamples: Load the samples of the children features, used in the contents page and playlist page @see Contents
 *  - featureShuffles: Load the shuffles of the children features, used in the frontend page @see ContentsShuffle
 */

import { useContentFeatures } from '../store/contentsStore';

import {
  classRoomContents,
  ClassRoomRouter,
  ClassRoomShuffle,
} from './ClassRoom';
import { liveContents, LiveRouter } from './Live';
import { videoContents, VideoRouter, routesVideo } from './Video';

useContentFeatures.setState({
  featureRouter: [
    <VideoRouter key="videoRouter" />,
    <ClassRoomRouter key="classRoomRouter" />,
    <LiveRouter key="liveRouter" />,
  ],
  featureRoutes: { ...routesVideo },
  featureSamples: (playlistId) => [
    videoContents(playlistId),
    liveContents(playlistId),
    classRoomContents(playlistId),
  ],
  featureShuffles: [<ClassRoomShuffle key="classRoomShuffle" />],
});
