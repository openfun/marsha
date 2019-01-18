import { connect } from 'react-redux';

import { RootState } from '../../data/rootReducer';
import { appStateSuccess } from '../../types/AppData';
import { modelName } from '../../types/models';
import { Video } from '../../types/tracks';
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
  state: RootState<appStateSuccess>,
  { video }: DashboardConnectedProps,
) => ({
  video:
    (state.resources[modelName.VIDEOS]!.byId &&
      state.resources[modelName.VIDEOS]!.byId[video.id]) ||
    video,
});

/**
 * Component. Displays a Dashboard with the state of the video in marsha's pipeline and provides links to
 * the player and to the form to replace the video with another one.
 * @param video The relevant Video record for which we're showing the state.
 */
export const DashboardConnected = connect(mapStateToProps)(Dashboard);
