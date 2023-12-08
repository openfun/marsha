import { getMetaPublicValue } from 'utils/dom';

const eventCDNLoadedEvent = new CustomEvent('CDNLoaded', {
  detail: {},
  bubbles: true,
  cancelable: true,
  composed: false,
});

document.addEventListener('DOMContentLoaded', () => {
  const metaPublicValue = getMetaPublicValue();
  if (metaPublicValue) {
    //__webpack_public_path__ = metaPublicValue;
  }

  window.isCDNLoaded = true;
  document.dispatchEvent(eventCDNLoadedEvent);
});
