import { ROOT_APP } from 'conf/global';

/**
 * Find the `public-path` meta tag. The value attribute contains the
 * static base url. This path is then used by webpack to build the static
 * urls. By convention this static base url always has a trailing slash.
 *
 * The dom must be loaded before this function is called.
 * @returns static base url
 */
export const getMetaPublicValue = (cdnReplaceKeyword: string) => {
  const metaPublicPath = document.querySelector('meta[name="public-path"]');

  if (metaPublicPath) {
    const metaPublicPathValue = metaPublicPath.getAttribute('value') || '';

    if (metaPublicPathValue && metaPublicPathValue !== cdnReplaceKeyword) {
      return `${metaPublicPathValue || ROOT_APP}`;
    }
  }

  return ROOT_APP;
};
