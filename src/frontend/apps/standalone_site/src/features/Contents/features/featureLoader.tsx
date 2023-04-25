/**
 * Init the contents feature state by loading the necessary children components:
 *  - featureRoutes: Load the routes of the children features (/my-contents/videos, /my-contents/classroom...) @see ContentsRouter
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
