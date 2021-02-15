// Test if the MediaSource API is available for the current browser

export const isMSESupported = () =>
  'MediaSource' in window &&
  typeof window.MediaSource.isTypeSupported === 'function';
