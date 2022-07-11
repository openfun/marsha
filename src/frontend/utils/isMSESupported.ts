import videojs from 'video.js';

// Test if the MediaSource API is available for the current browser

export const isMSESupported = () =>
  ('MediaSource' in window &&
    typeof window.MediaSource.isTypeSupported === 'function') ||
  //  ios only supports partially MSE but it is working fine
  videojs.browser.IS_IOS;
