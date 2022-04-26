import { fromParse5 } from 'hast-util-from-parse5';
import { Code, Parent } from 'mdast';
import { parseFragment } from 'parse5';
import { visit } from 'unist-util-visit';

import { markdownRenderLatex } from 'apps/markdown/data/queries';

const remarkLatexPlugin = (markdownDocumentId: string) => {
  // `markdownDocumentId` is mandatory to allow API calls
  return () => {
    return async function transformer(ast: any) {
      const instances: [string, number, Parent][] = [];

      visit<Code>(
        ast,
        // Only cat code block defined by "``` latex svg=true"
        // @ts-ignore
        { type: 'code', lang: 'latex', meta: 'svg=true' },
        (node, index, parent) => {
          instances.push([node.value, index!, parent as Parent]);
        },
      );

      if (!instances.length) {
        return ast;
      }

      await Promise.all(
        instances.map(async ([latexCode, indexInTree, parentNode]) => {
          try {
            const response = await markdownRenderLatex(
              markdownDocumentId,
              latexCode,
            );
            if (response.latex_image) {
              parentNode!.children[indexInTree] = {
                type: 'paragraph',
                children: [{ type: 'html', value: response.latex_image }],
                data: {
                  hProperties: { className: 'latex-inline' },
                  hChildren: [fromParse5(parseFragment(response.latex_image))],
                },
              };
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

export default remarkLatexPlugin;
