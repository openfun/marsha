import React from 'react';

import { AppDataContext } from '../..';
import { VideoJsPlayer } from '../VideoJsPlayer/VideoJsPlayer';

export const RootComponent = () => (
  <div className="root">
    <AppDataContext.Consumer>
      {({ video }) => <VideoJsPlayer video={video} />}
    </AppDataContext.Consumer>
  </div>
);
