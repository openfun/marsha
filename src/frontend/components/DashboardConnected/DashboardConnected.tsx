import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { addResource } from '../../data/genericReducers/resourceById/actions';
import { RootState } from '../../data/rootReducer';
import { modelName } from '../../types/models';
import { Video } from '../../types/Video';
import { Dashboard } from '../Dashboard/Dashboard';

/** Props shape for the DashboardConnected component. */
interface DashboardConnectedProps {
  video: Video;
}

/**
 * Replace the (read-only) video from context with one from the resources part of the
 * state if available as it will hold the most recent version.
 * Also, just pass the jwt along.
 */
export const mapStateToProps = (
  state: RootState,
  { video }: DashboardConnectedProps,
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
 * Component. Displays a Dashboard with the state of the video in marsha's pipeline and provides links to
 * the player and to the form to replace the video with another one.
 * @param jwt The JSON web token that allows the client to authenticate API requests.
 * @param video The relevant Video record for which we're showing the state.
 */
export const DashboardConnected = connect(
  mapStateToProps,
  mapDispatchToProps,
)(Dashboard);
