/**
 * Init the contents feature state by loading the necessary children components:
 *  - featureRouter: Load the router of the children features (/my-contents/videos, /my-contents/classroom...) @see ContentsRouter
 *  - featureRoutes: Load the routes and the link menu of the children features @see routes
 *  - featureSamples: Load the samples of the children features, used in the contents page and playlist page @see Contents
 *  - featureShuffles: Load the shuffles of the children features, used in the frontend page @see ContentsShuffle
 */

import { Fragment } from 'react';

import { FeatureSample, useContentFeatures } from '../store/contentsStore';

import {
  classRoomContents,
  ClassRoomRouter,
  ClassRoomShuffle,
  routesClassRoom,
} from './ClassRoom';
import { liveContents, LiveRouter, routesLive } from './Live';
import { videoContents, VideoRouter, routesVideo } from './Video';

enum RESOURCES_CHOICES {
  VIDEO = 'video',
  WEBINAR = 'webinar',
  CLASSROOM = 'classroom',
}

const featureLoader = (inactive_content_types: string[]) => {
  const featureRouter = [];
  let featureRoutes = {};
  const featureSamples: ((playlistId?: string) => FeatureSample)[] = [];
  const featureShuffles = [];
  if (!inactive_content_types.includes(RESOURCES_CHOICES.VIDEO)) {
    featureRouter.push(
      <Fragment key="videoRouter">
        <VideoRouter />
      </Fragment>,
    );
    featureSamples.push(videoContents);
    featureRoutes = { ...featureRoutes, ...routesVideo };
  }

  if (!inactive_content_types.includes(RESOURCES_CHOICES.WEBINAR)) {
    featureRouter.push(
      <Fragment key="liveRouter">
        <LiveRouter />
      </Fragment>,
    );
    featureSamples.push(liveContents);
    featureRoutes = { ...featureRoutes, ...routesLive };
  }

  if (!inactive_content_types.includes(RESOURCES_CHOICES.CLASSROOM)) {
    featureRouter.push(
      <Fragment key="classRoomRouter">
        <ClassRoomRouter />
      </Fragment>,
    );
    featureSamples.push(classRoomContents);
    featureRoutes = { ...featureRoutes, ...routesClassRoom };
    featureShuffles.push(
      <Fragment key="classRoomShuffle">
        <ClassRoomShuffle />
      </Fragment>,
    );
  }

  useContentFeatures.setState({
    featureRouter,
    featureRoutes,
    featureSamples: (playlistId) => {
      return featureSamples.map((sample) => {
        return sample(playlistId);
      });
    },
    featureShuffles,
  });
};

export default featureLoader;
