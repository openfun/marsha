import jwt_decode from 'jwt-decode';
import { AnyAction, Reducer } from 'redux';

import { AppData, appState } from '../../types/AppData';
import { DecodedJwt } from '../../types/jwt';
import { Video } from '../../types/tracks';
import { appData as initialState } from '../appData';

export interface ContextState<state> {
  jwt: state extends appState.ERROR ? null : string;
  decodedJwt: state extends appState.ERROR ? null : DecodedJwt;
  ltiResourceVideo: state extends appState.ERROR ? null : Video;
  ltiState: state;
}

export const buildInitialState = (appData: AppData) => ({
  decodedJwt: appData.jwt ? (jwt_decode(appData.jwt) as DecodedJwt) : null,
  jwt: appData.jwt || null,
  ltiResourceVideo: appData.video || null,
  ltiState: appData.state,
});

export const context: Reducer<ContextState<appState>> = (
  state: ContextState<appState> = buildInitialState(initialState),
  action?: AnyAction,
) => {
  return state;
};
