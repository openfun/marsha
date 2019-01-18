import { connect } from 'react-redux';

import { RootState } from '../../data/rootReducer';
import { appStateSuccess } from '../../types/AppData';
import { modelName } from '../../types/models';
import { VideoPlayer, VideoPlayerProps } from '../VideoPlayer/VideoPlayer';

/**
 * Replace the (read-only) video from context with one from the resources part of the
 * state if available as it will hold the most recent version.
 */
export const mapStateToProps = (
  state: RootState<appStateSuccess>,
  { video }: VideoPlayerProps,
) => ({
  video:
    (state.resources[modelName.VIDEOS]!.byId &&
      state.resources[modelName.VIDEOS]!.byId[(video && video.id) || '']) ||
    video,
});

/**
 * Component. Displays a player to show the video from context.
 * @param video The video to show.
 */
export const VideoPlayerConnected = connect(mapStateToProps)(VideoPlayer);
