import { AnyAction, Reducer } from 'redux';

import { PlayerTimeUpdateNotification } from './actions';

export interface PlayerState {
  currentTime: number;
}

export const initialState = {
  currentTime: 0,
};

export const player: Reducer<PlayerState> = (
  state: PlayerState = initialState,
  action?: PlayerTimeUpdateNotification | AnyAction,
) => {
  if (!action) {
    return state;
  }

  switch (action.type) {
    case 'PLAYER_TIME_UPDATE_NOTIFY':
      return {
        ...state,
        currentTime: action.currentTime,
      };
  }

  return state;
};
