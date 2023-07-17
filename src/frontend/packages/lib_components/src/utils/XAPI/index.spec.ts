import { liveState, videoMockFactory } from 'lib-components';

import { LiveXAPIStatement } from './LiveXapiStatement';
import { VideoXAPIStatement } from './VideoXAPIStatement';

import { XAPIStatement } from './index';

describe('XAPIStatement', () => {
  it('returns a LiveXapiStatement instance when video is live', () => {
    const video = videoMockFactory({
      live_state: liveState.RUNNING,
    });

    const xapiStatement = XAPIStatement('jwt', 'sessionId', video);

    expect(xapiStatement).toBeInstanceOf(LiveXAPIStatement);
  });

  it('returns a VideoXAPIStatement instance when video is not live', () => {
    const video = videoMockFactory();

    const xapiStatement = XAPIStatement('jwt', 'sessionId', video);

    expect(xapiStatement).toBeInstanceOf(VideoXAPIStatement);
  });
});
