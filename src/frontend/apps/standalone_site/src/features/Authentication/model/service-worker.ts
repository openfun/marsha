import { TokenResponse } from './response';

export enum EServiceworkerAuthAction {
  GET_REFRESH_TOKEN = 'GET_REFRESH_TOKEN',
  REFRESH_TOKEN_RESPONSE = 'REFRESH_TOKEN_RESPONSE',
  GET_ACCESS_TOKEN = 'GET_ACCESS_TOKEN',
  ACCESS_TOKEN_RESPONSE = 'ACCESS_TOKEN_RESPONSE',
  SET_TOKEN = 'SET_TOKEN',
  LOGOUT = 'LOGOUT',
}

export interface ServiceworkerAuthMessage {
  action: EServiceworkerAuthAction;
  requestId: number;
  valueSW?: TokenResponse;
  valueClient?: string;
}
