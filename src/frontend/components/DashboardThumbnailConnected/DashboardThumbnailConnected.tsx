import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { addResource } from '../../data/genericReducers/resourceById/actions';
import { RootState } from '../../data/rootReducer';
import { getThumbnail } from '../../data/thumbnail/selector';
import { appStateSuccess } from '../../types/AppData';
import { modelName } from '../../types/models';
import { Thumbnail, Video } from '../../types/tracks';
import { DashboardThumbnail } from '../DashboardThumbnail/DashboardThumbnail';

interface DashboardThumbnailConnectedProps {
  video: Video;
}

const mapStateToProps = (
  state: RootState<appStateSuccess>,
  { video }: DashboardThumbnailConnectedProps,
) => ({
  jwt: state.context.jwt,
  thumbnail: getThumbnail(state),
  video,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  addThumbnail: (thumbnail: Thumbnail) =>
    dispatch(addResource(modelName.THUMBNAIL, thumbnail)),
});

export const DashboardThumbnailConnected = connect(
  mapStateToProps,
  mapDispatchToProps,
)(DashboardThumbnail);
