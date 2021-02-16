// Test if the MediaSource API is available for the current browser

export const isMSESupported = () =>
  'MediaSource' in window &&
  // eslint-disable-next-line compat/compat
  typeof window.MediaSource.isTypeSupported === 'function';
