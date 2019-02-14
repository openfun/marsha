import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { getResourceList } from '../../data/genericReducers/resourceList/actions';
import { RootState } from '../../data/rootReducer';
import { getTimedTextTracks } from '../../data/timedtexttracks/selector';
import { ConsumableQuery } from '../../types/api';
import { appStateSuccess } from '../../types/AppData';
import { modelName } from '../../types/models';
import { TimedText, Video } from '../../types/tracks';
import { Nullable } from '../../utils/types';
import { VideoPlayer, VideoPlayerProps } from '../VideoPlayer/VideoPlayer';

type VideoPlayerConnectedProps = Pick<
  VideoPlayerProps,
  'createPlayer' | 'video'
>;

/**
 * Replace the (read-only) video from context with one from the resources part of the
 * state if available as it will hold the most recent version.
 */
export const mapStateToProps = (
  state: RootState<appStateSuccess>,
  { video }: VideoPlayerConnectedProps,
) => ({
  jwt: state.context.jwt,
  timedtexttracks: getTimedTextTracks(state),
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
