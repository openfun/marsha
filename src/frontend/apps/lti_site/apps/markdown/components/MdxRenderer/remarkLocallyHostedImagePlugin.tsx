import { visit } from 'unist-util-visit';

import { fetchOneMarkdownImage } from 'lib-markdown';
import { Image } from 'mdast';
import { MarkdownImageCache } from './types';

const remarkLocallyHostedImagePlugin = (
  localImagesUrlCache: MarkdownImageCache,
) => {
  // `markdownDocumentId` is mandatory to allow API calls
  return () => {
    return async function transformer(ast: any) {
      const instances: [Image][] = [];

      visit<Image>(ast, (node) => {
        if (node.url && node.url.startsWith('/uploaded/image/')) {
          instances.push([node]);
        }
      });

      if (!instances.length) {
        return ast;
      }

      await Promise.all(
        instances.map(async ([image]) => {
          try {
            const imageId = image.url.slice('/uploaded/image/'.length);

            if (
              Object.keys(localImagesUrlCache).includes(imageId) &&
              Date.now() < localImagesUrlCache[imageId].expiration
            ) {
              image.url = localImagesUrlCache[imageId].url;
            }

            if (image.url.startsWith('/uploaded/image/')) {
              const response = await fetchOneMarkdownImage(imageId);
              if (response.url) {
                localImagesUrlCache[imageId] = {
                  url: response.url,
                  expiration: Date.now() + 15 * 60 * 1000, // 15 minutes
                };
                image.url = response.url;
              } else {
                console.warn('local image fail', response);
              }
            }
          } catch (e) {
            // 400 will be caught here
            console.warn(e);
          }
        }),
      );

      return ast;
    };
  };
};

export default remarkLocallyHostedImagePlugin;
