import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { RootState } from '../../data/rootReducer';
import { getTimedTextTrackLanguageChoices } from '../../data/timedTextTrackLanguageChoices/action';
import { getTimedTextTracks } from '../../data/timedtexttracks/selector';
import { appStateSuccess } from '../../types/AppData';
import { modelName } from '../../types/models';
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
  languageChoices: state.languageChoices.items,
  timedtexttracks: getTimedTextTracks(state),
  video:
    (state.resources[modelName.VIDEOS]!.byId &&
      state.resources[modelName.VIDEOS]!.byId[(video && video.id) || '']) ||
    video,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  getTimedTextTrackLanguageChoices: (jwt: string) =>
    dispatch(getTimedTextTrackLanguageChoices(jwt)),
});

/**
 * Component. Displays a player to show the video from context.
 * @param video The video to show.
 */
export const VideoPlayerConnected = connect(
  mapStateToProps,
  mapDispatchToProps,
)(VideoPlayer);
