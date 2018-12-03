import { connect } from 'react-redux';

import { RootState } from '../../data/rootReducer';
import { AppRoutes } from '../AppRoutes/AppRoutes';

/**
 * Pick the state context so it can be used to render any route.
 */
export const mapStateToProps = (state: RootState) => ({
  context: state.context,
});

/**
 * Dynamically render all the possible routes in the app with proper context already
 * baked in.
 */
export const AppRoutesConnected = connect(mapStateToProps)(AppRoutes);
