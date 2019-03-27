import { connect } from 'react-redux';

import { RootState } from '../../data/rootReducer';
import { appStateSuccess } from '../../types/AppData';
import { Thumbnail } from '../../types/tracks';
import { DashboardObjectProgress } from '../DashboardObjectProgress/DashboardObjectProgress';

interface DashboardThumbnailProgressConnectedProps {
  thumbnailId: Thumbnail['id'];
}

const mapStateToProps = (
  state: RootState<appStateSuccess>,
  { thumbnailId }: DashboardThumbnailProgressConnectedProps,
) => ({
  progress: state.context.uploads_progress[thumbnailId],
});

export const DashboardThumbnailProgressConnected = connect(mapStateToProps)(
  DashboardObjectProgress,
);
