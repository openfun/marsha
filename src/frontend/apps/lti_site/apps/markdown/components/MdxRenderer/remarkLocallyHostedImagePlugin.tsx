import { visit } from 'unist-util-visit';

import { fetchOneMarkdownImage } from 'apps/markdown/data/queries';
import { Image } from 'mdast';

const remarkLocallyHostedImagePlugin = () => {
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
          const response = await fetchOneMarkdownImage(
            image.url.slice('/uploaded/image/'.length),
          );
          if (response.url) {
            image.url = response.url;
          } else {
            console.warn('local image fail', response);
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

export default remarkLocallyHostedImagePlugin;
