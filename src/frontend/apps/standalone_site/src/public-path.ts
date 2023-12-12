import { getMetaPublicValue } from 'utils/dom';

window.__toCdnUrl = function (importer) {
  if (typeof import.meta.env.VITE_CDN_REPLACE_KEYWORD !== 'string') {
    return '';
  }

  return (
    getMetaPublicValue(import.meta.env.VITE_CDN_REPLACE_KEYWORD) + importer
  );
};
