import { connect } from 'react-redux';

import { RootState } from '../../data/rootReducer';
import { appStateSuccess } from '../../types/AppData';
import { Video } from '../../types/tracks';
import { DashboardVideoPaneProgress } from '../DashboardVideoPaneProgress/DashboardVideoPaneProgress';

interface DashboardVideoPaneProgressConnectedProps {
  videoId: Video['id'];
}

const mapStateToProps = (
  state: RootState<appStateSuccess>,
  { videoId }: DashboardVideoPaneProgressConnectedProps,
) => ({
  progress: state.context.uploads_progress[videoId],
});

export const DashboardVideoPaneProgressConnected = connect(mapStateToProps)(
  DashboardVideoPaneProgress,
);
