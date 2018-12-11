import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { addResource } from '../../data/genericReducers/resourceById/actions';
import { RootState } from '../../data/rootReducer';
import { modelName } from '../../types/models';
import { Video } from '../../types/tracks';
import { VideoForm } from '../VideoForm/VideoForm';

/** Props shape for the VideoFormConnected component. */
interface VideoFormConnectedProps {
  video: Video;
}

/**
 * Replace the (read-only) video from context with one from the resources part of the
 * state if available as it will hold the most recent version.
 * Also, just pass the jwt along.
 */
export const mapStateToProps = (
  state: RootState,
  { video }: VideoFormConnectedProps,
) => ({
  jwt: state && state.context && state.context.jwt,
  video:
    (state &&
      state.resources[modelName.VIDEOS]!.byId &&
      state.resources[modelName.VIDEOS]!.byId[(video && video.id) || '']) ||
    video,
});

/** Create a function that updates a single video in the store. */
const mapDispatchToProps = (dispatch: Dispatch) => ({
  updateVideo: (video: Video) => dispatch(addResource(modelName.VIDEOS, video)),
});

/**
 * Component. Displays a form with a dropzone and a file upload button to add a video file
 * to the video from context.
 * @param jwt The JSON web token that allows the client to authenticate API requests.
 * @param video The relevant Video record for which we're uploading a video file.
 */
export const VideoFormConnected = connect(
  mapStateToProps,
  mapDispatchToProps,
)(VideoForm);
