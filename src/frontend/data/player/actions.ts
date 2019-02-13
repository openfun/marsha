export interface PlayerTimeUpdateNotification {
  currentTime: number;
  type: 'PLAYER_TIME_UPDATE_NOTIFY';
}

export function notifyPlayerTimeUpdate(
  currentTime: number,
): PlayerTimeUpdateNotification {
  return { currentTime, type: 'PLAYER_TIME_UPDATE_NOTIFY' };
}
