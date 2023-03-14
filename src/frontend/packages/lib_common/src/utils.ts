export const isIframe = () => window !== window.parent;
export const isFirefox = () =>
  navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
