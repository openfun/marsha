import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { DashboardVideoPaneDownloadOption } from '../DashboardVideoPaneDownloadOption/DashboardVideoPaneDownloadOption';

import { addResource } from '../../data/genericReducers/resourceById/actions';
import { modelName } from '../../types/models';
import { Video } from '../../types/tracks';

const mapDistachToProps = (dispatch: Dispatch) => ({
  addResource: (video: Video) => dispatch(addResource(modelName.VIDEOS, video)),
});

export const DashboardVideoPaneDownloadOptionConnected = connect(
  null,
  mapDistachToProps,
)(DashboardVideoPaneDownloadOption);
