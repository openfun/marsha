import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { getResourceList } from '../../data/genericReducers/resourceList/actions';
import { RootState } from '../../data/rootReducer';
import { getTimedTextTracks } from '../../data/timedtexttracks/selector';
import { ConsumableQuery } from '../../types/api';
import { appStateSuccess } from '../../types/AppData';
import { modelName } from '../../types/models';
import { TimedText } from '../../types/tracks';
import { DashboardTimedTextPane } from '../DashboardTimedTextPane/DashboardTimedTextPane';

/**
 * Build props for `<DashboardTimedTextPaneConnected />` from `RootState`.
 * Intended for internal use, exported for testing purposes only.
 */
export const mapStateToProps = (state: RootState<appStateSuccess>) => ({
  jwt: state.context.jwt,
  timedtexttracks: getTimedTextTracks(state),
});

/** Create a function that adds a bunch of timedtexttracks in the store. */
const mergeProps = (
  {
    jwt,
    timedtexttracks,
  }: { jwt: string; timedtexttracks: ConsumableQuery<TimedText> },
  { dispatch }: { dispatch: Dispatch },
) => ({
  getTimedTextTrackList: () =>
    dispatch(getResourceList(jwt, modelName.TIMEDTEXTTRACKS)),
  timedtexttracks,
});

/**
 * Component. Displays the complete timedtexttrack management area in the dashboard, that lets the user
 * create, delete and modify timedtexttracks related to their video.
 */
export const DashboardTimedTextPaneConnected = connect(
  mapStateToProps,
  null!,
  mergeProps,
)(DashboardTimedTextPane);
