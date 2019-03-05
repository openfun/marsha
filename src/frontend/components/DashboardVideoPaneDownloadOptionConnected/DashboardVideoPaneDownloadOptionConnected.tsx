import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { DashboardVideoPaneDownloadOption } from '../DashboardVideoPaneDownloadOption/DashboardVideoPaneDownloadOption';

import { addResource } from '../../data/genericReducers/resourceById/actions';
import { RootState } from '../../data/rootReducer';
import { appStateSuccess } from '../../types/AppData';
import { modelName } from '../../types/models';
import { Video } from '../../types/tracks';

const mapStateToProps = (state: RootState<appStateSuccess>) => ({
  jwt: state.context.jwt,
});

const mapDistachToProps = (dispatch: Dispatch) => ({
  addResource: (video: Video) => dispatch(addResource(modelName.VIDEOS, video)),
});

export const DashboardVideoPaneDownloadOptionConnected = connect(
  mapStateToProps,
  mapDistachToProps,
)(DashboardVideoPaneDownloadOption);
