/**
 * Dashjs requires the Media Source Extensions (MSE) to work. They are not available in every browser,
 * we therefore need to do a feature check before we initialize dash.
 */
export const isMSESupported = () =>
  !!(window as { MediaSource?: MediaSource }).MediaSource &&
  !!MediaSource.isTypeSupported;

export const isHlsSupported = (video: HTMLVideoElement): boolean =>
  typeof video.canPlayType === 'function' &&
  !!video.canPlayType('application/vnd.apple.mpegurl');
