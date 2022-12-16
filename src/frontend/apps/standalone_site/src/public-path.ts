import { getMetaPublicValue } from 'utils/dom';

document.addEventListener('DOMContentLoaded', () => {
  const metaPublicValue = getMetaPublicValue();
  if (metaPublicValue) {
    __webpack_public_path__ = metaPublicValue;
  }
});
